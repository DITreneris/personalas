# Prompt Anatomy – US HR hiring (repo: Personalas)

Static site: **10 free hiring prompts** + **paid PDF guides** (Beginner $5.99, Advanced $11.99 via Stripe). Public brand: **Prompt Anatomy** only on customer-facing pages.

**Live site:** [https://promptanatomy.help/en/](https://promptanatomy.help/en/) (EN-only). Root `/` and `/privacy.html` are EN gateways → `/en/`. Legacy `/lt/*` URLs redirect to `/en/*` ([vercel.json](vercel.json)).

**Production:** [Vercel](https://promptanatomy.help) — paid PDFs need serverless `api/` + Stripe, Upstash, Resend ([DEPLOYMENT.md](DEPLOYMENT.md)). GitHub Pages is static-only (no paid PDF fulfillment).

## Build

```bash
npm install
npm run build   # templates → en/index.html, en/privacy.html, gateways, sitemap
npm test        # build + pdf:validate + structure tests + HTML/JS lint
```

`npm test` is the merge gate (same as Vercel build). It runs `pdf:validate` — ensure PDF HTML sources are in place or fix before PR.

- **Public UI copy & SEO:** [config/sot.json](config/sot.json) (`brand.publicName`, `marketing.*`) + [scripts/build-locale-pages.js](scripts/build-locale-pages.js)
- **Page structure / prompts:** [templates/index-lt.html](templates/index-lt.html) (LT authoring source — **not shipped**; build outputs EN only)
- **Privacy:** [templates/privacy.html](templates/privacy.html)
- Do **not** hand-edit generated `en/*` except via rebuild

**OG image:** `npm run generate:og` → [images/og-default.png](images/og-default.png)

## PDF guides (source → export → covers)

1. Edit [docs/pdf-source/beginner-personalas-hr.html](docs/pdf-source/beginner-personalas-hr.html) and [docs/pdf-source/advanced-personalas-hr.html](docs/pdf-source/advanced-personalas-hr.html) (brand: **Prompt Anatomy** on covers/footers)
2. `npm run pdf:validate && npm run pdf:export`
3. `npm run pdf:covers && npm run pdf:covers:preview` → [assets/pdf-covers/](assets/pdf-covers/)

See [docs/pdf-source/README.md](docs/pdf-source/README.md).

## Internal (not public brand)

- Repo / `config/sot.json` `product.name` may stay `Personalas` for internal labels
- **Never** put “Personalas”, “Series No. 3”, or Lithuanian UI text on shipped HTML — see [docs/language-guidelines-en-lt.md](docs/language-guidelines-en-lt.md)

## Documentation

- [docs/INDEX.md](docs/INDEX.md) — doc index  
- [docs/AGENT_SOT.md](docs/AGENT_SOT.md) — **agent operational SOT** (paths, build, deploy)  
- [AGENTS.md](AGENTS.md) — agent workflow  
- [docs/language-guidelines-en-lt.md](docs/language-guidelines-en-lt.md) — **public brand + EN-only rules**  
- [docs/process/development.md](docs/process/development.md) · [DEPLOYMENT.md](DEPLOYMENT.md)

## GitHub Pages (optional)

Push to `main` → Actions → Deploy to GitHub Pages. Configure [Settings → Pages](https://github.com/DITreneris/personalas/settings/pages) → source: GitHub Actions.

```bash
git remote add personalas https://github.com/DITreneris/personalas.git
git push personalas main
```
