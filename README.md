# Prompt Anatomy – US HR hiring prompts

**For US HR and recruiting teams** who already use ChatGPT, Claude, or Gemini — and still need a shared loop, not another ATS.

Keep Greenhouse / Ashby / Workable / LinkedIn Recruiter. Keep your ChatGPT tab. This is the structured scorecard and JD rewrite layer those tools do not sell for $6.

**Outcome:** run a repeatable U.S. hiring loop in minutes — diagnose the funnel, rewrite the job ad, plan interviews, close the offer, support the first 90 days.

### Try it in 10 minutes

1. Open the live Hire kit: [promptanatomy.help/en/](https://www.promptanatomy.help/en/?utm_source=github&utm_medium=readme&utm_campaign=hire)
2. Copy one free prompt (start with the [job ad rewrite](https://www.promptanatomy.help/en/hr-ai-prompts/job-description/?utm_source=github&utm_medium=readme&utm_campaign=hire) or [interview scorecard](https://www.promptanatomy.help/en/hr-ai-prompts/interview-scorecard/?utm_source=github&utm_medium=readme&utm_campaign=hire))
3. Paste into ChatGPT, Claude, or Gemini — role-level fields only; strip candidate PII

**Then:**

- [PDF hiring guides](https://www.promptanatomy.help/en/?utm_source=github&utm_medium=readme&utm_campaign=hire#pdf-guides) — Beginner $5.99 · Advanced $11.99 · Bundle $15.99 (Stripe, instant download)
- [Full Prompt Anatomy training](https://www.promptanatomy.app/?utm_source=github&utm_medium=readme&utm_campaign=hire) — brand HQ / checkout
- [Hiring Prompts Without the Data Leak](https://www.promptanatomy.blog/articles/hiring-prompts-help-launch/?utm_source=github&utm_medium=readme&utm_campaign=hire) — why guardrails come before template depth (blog)

**Product:** Hire spoke of Prompt Anatomy on [promptanatomy.help](https://www.promptanatomy.help/en/). **Local KPI:** paid PDF (`primaryKpi: pdf`). **Brand north star:** [promptanatomy.app](https://www.promptanatomy.app/). Public name: **Prompt Anatomy** only.

**Bet / roadmap:** [ROADMAP.md](ROADMAP.md) · H0 checklist: [TODO.md](TODO.md)

---

## Contents (operators / contributors)

- [Build](#build)
- [SEO + GEO + AI crawlers](#seo--geo--ai-crawlers-2026)
- [PDF guides](#pdf-guides-source--export--covers)
- [Internal naming](#internal-not-public-brand)
- [Documentation](#documentation)

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

**Live site:** [https://www.promptanatomy.help/en/](https://www.promptanatomy.help/en/) (EN-only). Root `/` and `/privacy.html` are EN gateways → `/en/`. Legacy `/lt/*` URLs redirect to `/en/*` ([vercel.json](vercel.json)). Canonical host: **www**.

**Production:** [Vercel](https://www.promptanatomy.help) — paid PDFs need serverless `api/` + Stripe, Upstash, Resend ([DEPLOYMENT.md](DEPLOYMENT.md)). GitHub Pages deploy is **retired** (it published the full repo).

## SEO + GEO + AI crawlers (2026)

**Brand north star:** entity HQ and Training hub → [promptanatomy.app](https://www.promptanatomy.app/). **This site:** Hire spoke on `.help` (`WebSite.url`); local PDF KPI unchanged.

The build script emits every SEO / GEO / AI-crawler surface from `config/sot.json` — never hand-edit the outputs:

- [robots.txt](robots.txt) — per-AI-bot policy (allow citation bots like `OAI-SearchBot`, `PerplexityBot`; carve out `/assets/samples/` + `/assets/pdf-covers/` + `/api/` from training bots like `GPTBot`, `Google-Extended`; block training-only crawlers like `CCBot`, `Bytespider`).
- [sitemap.xml](sitemap.xml) — canonical HTML only: `/en/`, `/en/privacy.html`, `/terms.html`, plus 3× `/en/hr-ai-prompts/<slug>/`; `xmlns:image`, per-URL `<lastmod>` from git, image entries on `/en/`. No `.md` locs.
- [llms.txt](llms.txt) + [llms-full.txt](llms-full.txt) — AI site map (`H1` + blockquote + **Training hub → `.app`** + Free/Paid/Contact + `## Optional` legal) and full prompt digest. Spoke bullets in `llms.txt` point at `index.md` twins (v2). Google Search ignores `llms.txt`.
- `rel="describedby"` → `/llms.txt` on public HTML; landing + spokes also `rel="alternate" type="text/markdown"`. Generated `/en/index.md` + 3 spoke `index.md` (`.vercelignore` `!en/**/*.md`).
- [manifest.webmanifest](manifest.webmanifest) — PWA-lite manifest (`start_url: /en/`, theme_color navy).
- [404.html](404.html) — EN-only, `noindex, follow`, **no** canonical to `/en/` (body links only).
- `7a4b...4d.txt` — IndexNow protocol key (www host). Post-deploy ping: [.github/workflows/deploy.yml](.github/workflows/deploy.yml) via `npm run seo:indexnow:diff` (non-blocking); only sitemap-canonical URLs.
- JSON-LD: `WebSite` (`.help`) + `Organization` (`url` = `.app`; `sameAs` = app, blog, site, telegram, X, LinkedIn) + `Person` Tomas Staniulis + `FAQPage` (**8** Q+A = 3 front + 5 buyer) + 3× `Product`/`Offer`/`MerchantReturnPolicy` + `BreadcrumbList` + `speakable` + WebPage `dateModified`.
- Headers ([vercel.json](vercel.json)): `Content-Security-Policy` **enforce**, `Origin-Agent-Cluster: ?1`, content-type rules for `llms.txt` / EN `*.md` / `manifest.webmanifest` / IndexNow key.

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
- [ROADMAP.md](ROADMAP.md) — product bet B × horizons  
- [TODO.md](TODO.md) — open H0 checklist  
- [MUST_TODO.md](MUST_TODO.md) — purchase / promo ops leftovers  

## GitHub Pages (retired)

Do not enable Pages. The old workflow published `docs/pdf-source/` (paid HTML) at `ditreneris.github.io`. Unpublish: Settings → Pages → Source **None**. Paid PDF fulfillment is Vercel-only.

**GitHub About (operator):** Homepage = `https://www.promptanatomy.help/en/`; Description = one-line EN outcome for US HR; Topics = `hr`, `recruiting`, `prompts`, `chatgpt`, `hiring`.
