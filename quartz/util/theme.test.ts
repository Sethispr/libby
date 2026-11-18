import test from "node:test"
import assert from "node:assert/strict"
import { formatFontSpecification, googleFontHref, type Theme } from "./theme"

test("formatFontSpecification preserves single-weight italic fonts", () => {
  const result = formatFontSpecification("title", {
    name: "Cormorant Garamond",
    weights: [600],
    includeItalic: true,
  })
  assert.equal(result, "Cormorant+Garamond:ital,wght@0,600;1,600")
})

test("formatFontSpecification handles single 400 regular font cleanly", () => {
  const result = formatFontSpecification("accent", {
    name: "Emilys Candy",
    weights: [400],
    includeItalic: false,
  })
  assert.equal(result, "Emilys+Candy")
})

test("googleFontHref includes title, header, body, code, and accent fonts", () => {
  const theme: Theme = {
    fontOrigin: "googleFonts",
    cdnCaching: true,
    colors: {
      lightMode: {
        light: "#e5e6e1",
        lightgray: "#d1d0cc",
        gray: "#5a4864",
        darkgray: "#241929",
        dark: "#241929",
        secondary: "#840b2a",
        tertiary: "#dd1440",
        highlight: "rgba(246, 150, 179, 0.32)",
        textHighlight: "rgba(221, 20, 64, 0.16)",
      },
      darkMode: {
        light: "#241929",
        lightgray: "#3b2c43",
        gray: "#73607d",
        darkgray: "#e5e6e1",
        dark: "#e5e6e1",
        secondary: "#ffb3c8",
        tertiary: "#ffd1de",
        highlight: "rgba(132, 11, 42, 0.42)",
        textHighlight: "rgba(221, 20, 64, 0.3)",
      },
    },
    typography: {
      title: { name: "Cormorant Garamond", weights: [400, 600, 700], includeItalic: true },
      header: { name: "Yeseva One", weights: [400], includeItalic: false },
      body: { name: "Nunito", weights: [400, 600, 700, 800], includeItalic: true },
      code: { name: "JetBrains Mono", weights: [400, 600], includeItalic: true },
      accent: { name: "Emilys Candy", weights: [400], includeItalic: false },
    },
  }

  const href = googleFontHref(theme)
  assert.match(href, /family=Yeseva\+One/)
  assert.match(href, /family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600;1,700;1,800/)
  assert.match(href, /family=JetBrains\+Mono:ital,wght@0,400;0,600;1,400;1,600/)
  assert.match(href, /family=Cormorant\+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700/)
  assert.match(href, /family=Emilys\+Candy/)
})
