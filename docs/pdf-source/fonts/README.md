# Self-hosted PDF fonts

The 6 `.woff2` files in this directory are **committed to the repository** so
the PDF print stylesheet ([`../pdf-print.css`](../pdf-print.css)) can reference
them via `@font-face` and Playwright (`npm run pdf:export`) can render the
guides with **no egress to `fonts.googleapis.com`**.

Resolution order (per `@font-face`):

1. System-installed Inter / JetBrains Mono (via `local('...')`).
2. The committed `./<font>.woff2` file (this directory).
3. The Google Fonts `<link>` in the PDF HTML (online fallback only).
4. System UI fonts (`'Segoe UI', Arial, Consolas, Courier New`).

## Committed files

| Filename | Family / Weight | Subset | Approx. size |
|----------|-----------------|--------|--------------|
| `Inter-Regular.woff2` | Inter 400 | latin | ~47 kB |
| `Inter-SemiBold.woff2` | Inter 600 | latin | ~47 kB |
| `Inter-Bold.woff2` | Inter 700 | latin | ~47 kB |
| `Inter-ExtraBold.woff2` | Inter 800 | latin | ~47 kB |
| `JetBrainsMono-Regular.woff2` | JetBrains Mono 400 | latin | ~31 kB |
| `JetBrainsMono-SemiBold.woff2` | JetBrains Mono 600 | latin | ~31 kB |

Total: ~250 kB. Subset is `latin` (Basic Latin / ASCII) — matches the PDF
content (US English only, no diacritics; see `AGENTS.md`).

## Refreshing the files

If Google Fonts pushes a new build of either family, regenerate:

```
npm run pdf:fonts            # idempotent: skips files that already exist
node scripts/fetch-pdf-fonts.js --force   # force re-download all 6
```

[`scripts/fetch-pdf-fonts.js`](../../../scripts/fetch-pdf-fonts.js) hits the
Google Fonts CSS2 API with a Chrome User-Agent (required to be served
`.woff2`), parses the `@font-face` blocks, prefers the `latin` subset (falls
back to `latin-ext`), and writes the binaries into this folder.

After refresh, run `npm run pdf:export` and visually verify the rendered PDF
matches the previous build (typography contract in
[`../README.md`](../README.md)).

## License

Both font families are **SIL Open Font License 1.1** (OFL). Bundling them in
this repository is permitted.

References:

- Inter — https://github.com/rsms/inter/blob/master/LICENSE.txt
- JetBrains Mono — https://github.com/JetBrains/JetBrainsMono/blob/master/OFL.txt
