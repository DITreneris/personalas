# Prompt Anatomy – US HR hiring (repo: Personalas)

**Hire spoke** of Prompt Anatomy on [promptanatomy.help](https://www.promptanatomy.help/en/): **10 free hiring prompts** + **paid PDF guides** (Beginner $5.99, Advanced $11.99 via Stripe). **Brand north star / HQ:** [promptanatomy.app](https://www.promptanatomy.app/). **Local spoke KPI:** PDF (`primaryKpi: pdf`). Public brand name: **Prompt Anatomy** only on customer-facing pages.

**Live site:** [https://www.promptanatomy.help/en/](https://www.promptanatomy.help/en/) (EN-only). Root `/` and `/privacy.html` are EN gateways → `/en/`. Legacy `/lt/*` URLs redirect to `/en/*` ([vercel.json](vercel.json)). Canonical host: **www**.

**Production:** [Vercel](https://www.promptanatomy.help) — paid PDFs need serverless `api/` + Stripe, Upstash, Resend ([DEPLOYMENT.md](DEPLOYMENT.md)). GitHub Pages deploy is **retired** (it published the full repo).

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

**OG image:** `npm run generate:og` → [images/og-default-v3.png](images/og-default-v3.png) (copy from `config/sot.json` → `marketing.seo.ogImage`; bump filename in [scripts/build-locale-pages.js](scripts/build-locale-pages.js) `OG_IMAGE_REL` when busting social caches)

## SEO + GEO + AI crawlers (2026)

**Brand north star:** entity HQ and Training hub → [promptanatomy.app](https://www.promptanatomy.app/). **This site:** Hire spoke on `.help` (`WebSite.url`); local PDF KPI unchanged.

The build script emits every SEO / GEO / AI-crawler surface from `config/sot.json` — never hand-edit the outputs:

- [robots.txt](robots.txt) — per-AI-bot policy (allow citation bots like `OAI-SearchBot`, `PerplexityBot`; carve out `/assets/samples/` + `/assets/pdf-covers/` + `/api/` from training bots like `GPTBot`, `Google-Extended`; block training-only crawlers like `CCBot`, `Bytespider`).
- [sitemap.xml](sitemap.xml) — canonical locs only: `/en/`, `/en/privacy.html`, `/terms.html`; `xmlns:image`, per-URL `<lastmod>` from git, image entries on `/en/`.
- [llms.txt](llms.txt) + [llms-full.txt](llms-full.txt) — AI site map (`H1` + blockquote + **Training hub → `.app`** + Free/Paid/Contact + `## Optional` legal) and full prompt digest.
- [manifest.webmanifest](manifest.webmanifest) — PWA-lite manifest (`start_url: /en/`, theme_color navy).
- [404.html](404.html) — EN-only, `noindex, follow`, canonical to `/en/`.
- `7a4b...4d.txt` — IndexNow protocol key (www host). Post-deploy ping: [.github/workflows/deploy.yml](.github/workflows/deploy.yml) via `npm run seo:indexnow:diff` (non-blocking); only sitemap-canonical URLs.
- JSON-LD: `WebSite` (`.help`) + `Organization` (`url` = `.app`; `sameAs` = app, blog, site, telegram, X, LinkedIn) + `Person` Tomas Staniulis + `FAQPage` (**8** Q+A = 3 front + 5 buyer) + 3× `Product`/`Offer`/`MerchantReturnPolicy` + `BreadcrumbList` + `speakable` + WebPage `dateModified`.
- Headers ([vercel.json](vercel.json)): `Content-Security-Policy` **enforce**, `Origin-Agent-Cluster: ?1`, content-type rules for `llms.txt` / `manifest.webmanifest` / IndexNow key.

**Full contract:** [docs/AGENT_SOT.md](docs/AGENT_SOT.md) §1 + §6a, [docs/security.md](docs/security.md).

## PDF guides (source → export → covers)

1. Edit [docs/pdf-source/beginner-personalas-hr.html](docs/pdf-source/beginner-personalas-hr.html) and [docs/pdf-source/advanced-personalas-hr.html](docs/pdf-source/advanced-personalas-hr.html) (brand: **Prompt Anatomy** on covers/footers)
2. `npm run pdf:validate && npm run pdf:export`
3. `npm run pdf:covers && npm run pdf:covers:preview` → [assets/pdf-covers/](assets/pdf-covers/)

See [docs/pdf-source/README.md](docs/pdf-source/README.md).

## Internal (not public brand)

- Repo npm name / `config/sot.json` `product.repoName` may stay `Personalas` for internal labels; public `product.name` is Prompt Anatomy
- **Never** put “Personalas”, “Series No. 3”, or Lithuanian UI text on shipped HTML — see [docs/language-guidelines-en-lt.md](docs/language-guidelines-en-lt.md)

## Documentation

- [docs/INDEX.md](docs/INDEX.md) — tiered doc hub  
- [docs/AGENT_SOT.md](docs/AGENT_SOT.md) — **agent operational SOT** (paths, build, deploy)  
- [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md) — DMS (tiers, lifecycle)  
- [AGENTS.md](AGENTS.md) — agent roles / workflow  
- [docs/language-guidelines-en-lt.md](docs/language-guidelines-en-lt.md) — public brand + EN-only  
- [DEPLOYMENT.md](DEPLOYMENT.md) — Vercel / env

## GitHub Pages (retired)

Do not enable Pages. The old workflow published `docs/pdf-source/` (paid HTML) at `ditreneris.github.io`. Unpublish: Settings → Pages → Source **None**. Paid PDF fulfillment is Vercel-only.
