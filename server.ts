import http from "node:http"
import fs from "node:fs"
import path from "node:path"

const PORT = Number(process.env.PORT || 3000)
const HOST = "0.0.0.0"
const PUBLIC_DIR = path.resolve("public")

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
}

function sendFile(res: http.ServerResponse, filePath: string, status = 200) {
  const ext = path.extname(filePath).toLowerCase()
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream"
  res.writeHead(status, {
    "Content-Type": contentType,
    "Content-Disposition": "inline",
  })
  fs.createReadStream(filePath).pipe(res)
}

function resolveFromPublic(reqPath: string): string | null {
  const decoded = decodeURIComponent(reqPath)
  const safePath = path.posix.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, "")
  const target = path.join(PUBLIC_DIR, safePath)

  if (!target.startsWith(PUBLIC_DIR)) return null

  if (fs.existsSync(target) && fs.statSync(target).isFile()) {
    return target
  }
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    const indexHtml = path.join(target, "index.html")
    if (fs.existsSync(indexHtml)) return indexHtml
  }
  if (!path.extname(target)) {
    const withHtml = `${target}.html`
    if (fs.existsSync(withHtml)) return withHtml
    const withIndex = path.join(target, "index.html")
    if (fs.existsSync(withIndex)) return withIndex
  }
  return null
}

function getBasePathPrefix(): string {
  try {
    const configPath = path.resolve("quartz.config.default.yaml")
    if (!fs.existsSync(configPath)) return ""
    const raw = fs.readFileSync(configPath, "utf8")
    const match = raw.match(/^\s*baseUrl:\s*["']?([^\s"']+)["']?/m)
    if (!match?.[1]) return ""
    const normalized = match[1].includes("://") ? match[1] : `https://${match[1]}`
    const pathname = new URL(normalized).pathname.replace(/\/+$/, "")
    return pathname === "/" ? "" : pathname
  } catch {
    return ""
  }
}

const BASE_PATH_PREFIX = getBasePathPrefix()

function resolvePublicFile(reqPath: string): string | null {
  const direct = resolveFromPublic(reqPath)
  if (direct) return direct

  if (
    BASE_PATH_PREFIX &&
    (reqPath === BASE_PATH_PREFIX || reqPath.startsWith(`${BASE_PATH_PREFIX}/`))
  ) {
    const stripped = reqPath.slice(BASE_PATH_PREFIX.length) || "/"
    return resolveFromPublic(stripped)
  }

  return null
}

const server = http.createServer((req, res) => {
  const rawUrl = req.url ?? "/"
  const reqPath = rawUrl.split("?")[0] || "/"

  const file = resolvePublicFile(reqPath)
  if (file) {
    sendFile(res, file, 200)
    return
  }

  const notFoundPage = path.join(PUBLIC_DIR, "404.html")
  if (fs.existsSync(notFoundPage)) {
    sendFile(res, notFoundPage, 404)
    return
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
  res.end("Not Found")
})

server.listen(PORT, HOST, () => {
  console.log(`Quartz static server listening at http://${HOST}:${PORT}`)
})
