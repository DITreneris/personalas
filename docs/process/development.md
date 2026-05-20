# Lokalaus kūrimo ir PR procesas

1. Šaka nuo `main` → pakeitimai → `npm test`
2. **Turinys:** redaguokite **[`templates/index-lt.html`](../../templates/index-lt.html)** (authoring) ir **[`templates/privacy.html`](../../templates/privacy.html)** – ne šaknies `index.html` / `privacy.html` (EN vartai po `npm run build`). Ne `privatumas-lt.html` (deprecated).
3. **Kalbos modelis:** viešas kanonas **`/en/`**; build generuoja tik `en/`; `/lt/*` produkcijoje redirect į `/en/*`. Žr. [AGENT_SOT.md](../AGENT_SOT.md), [language-guidelines-en-lt.md](../language-guidelines-en-lt.md).
4. PR aprašas: kas keista, kodėl; nuoroda į susijusius doc, jei keičiami procesai
5. Merge po CI žalios ir (jei taikoma) peržiūros
