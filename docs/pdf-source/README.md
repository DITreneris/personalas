# PDF source files

HTML + CSS source for the two paid Personalas HR PDF guides. Output PDFs are produced via browser **Save as PDF** (no build step on Vercel). Brand: every page footer shows `www.promptanatomy.app`; cover and closing pages feature `promptanatomy.help`.

## Files

- [beginner-personalas-hr.html](beginner-personalas-hr.html) — 12-page Beginner guide.
- [advanced-personalas-hr.html](advanced-personalas-hr.html) — 24-page Advanced guide (regenerate with `node scripts/generate-advanced-pdf-html.js` if structure changes).
- [pdf-print.css](pdf-print.css) — shared print stylesheet.

## Output filenames (local dev)

| Guide | Save as |
|-------|---------|
| Beginner | `api/_private/pdfs/beginner-guide.pdf` |
| Advanced | `api/_private/pdfs/advanced-guide.pdf` |

Canonical marketing names (rename when ready): `Beginner_Personalas_HR.pdf`, `Advanced_Personalas_HR.pdf`.

Customer download names (set in [api/_lib/fulfillment.js](../../api/_lib/fulfillment.js)): `personalas-beginner-guide.pdf`, `personalas-advanced-guide.pdf`.

Production: upload to private storage → `PDF_BEGINNER_SOURCE_URL`, `PDF_ADVANCED_SOURCE_URL` (see [DEPLOYMENT.md](../../DEPLOYMENT.md)).

## Export procedure (Chrome / Edge)

1. Serve the repo locally:

```bash
npx serve . -l 3000
```

2. Open `http://127.0.0.1:3000/docs/pdf-source/beginner-personalas-hr.html`
3. `Ctrl+P` / `Cmd+P` → **Save as PDF**

| Setting | Value |
|---------|--------|
| Paper | **Letter** |
| Margins | **None** |
| Scale | **Default (100%)** |
| Headers and footers | **OFF** |
| Background graphics | **ON** |

4. Verify: **12** pages (Beginner) or **24** (Advanced); footer `www.promptanatomy.app` on every page; cover shows `promptanatomy.help`.
5. Repeat for `advanced-personalas-hr.html`.

### Automated export (optional)

```bash
npm run pdf:export
npm run pdf:covers -- --preview
```

Uses Playwright to write PDFs under `api/_private/pdfs/` and PNG covers under `assets/pdf-covers/`.

## Editing rules

- One printed page = one `<section class="page">` with a `.brand-footer` (update Page N when reordering).
- Keep page counts exact: **12** / **24**.
- Run `node scripts/build-pdf-html.js` after edits.
- Do not put candidate PII in examples.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| White cover | Turn **Background graphics** ON |
| Wrong page count | Shorten content or split into a new `.page` |
| Footer missing URL | Serve via `npx serve`, not `file://` |
