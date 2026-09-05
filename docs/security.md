# Saugumas ir priklausomybės

- Periodiškai: `npm audit`
- Nenaudoti commitinti slaptų raktų; žr. repo `.gitignore` (`.env`, `.pem`)

---

## HTTP saugumo header'iai ([vercel.json](../vercel.json) `/(.*)` block'as)

| Header | Reikšmė | Paskirtis |
|--------|---------|-----------|
| `X-Content-Type-Options` | `nosniff` | MIME sniffing apsauga |
| `X-Frame-Options` | `DENY` | clickjacking apsauga (legacy; `frame-ancestors` CSP'e taip pat) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | minimaliai leakinama referrer info |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | drausti API'us — nė vienas nereikalingas |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HSTS 2y, preload-eligible |
| `Cross-Origin-Opener-Policy` | `same-origin` | proces izoliacija (Spectre) |
| `Cross-Origin-Resource-Policy` | `same-origin` | resource isolation (default) |
| `Origin-Agent-Cluster` | `?1` | process isolation per origin (2026 hardening) |
| `Content-Security-Policy` | (žr. žemiau) | **Enforce** — `script-src` be `'unsafe-inline'`; `style-src` dar leidžia inline |

## CSP (enforce)

```
default-src 'self';
script-src 'self' https://va.vercel-scripts.com https://*.vercel-insights.com https://plausible.io https://unpkg.com;
style-src 'self' 'unsafe-inline';
font-src 'self' data:;
img-src 'self' data: https:;
connect-src 'self' https://*.vercel-insights.com https://vitals.vercel-insights.com https://api.stripe.com;
frame-src https://buy.stripe.com https://js.stripe.com;
base-uri 'self';
form-action 'self' https://buy.stripe.com;
frame-ancestors 'none';
upgrade-insecure-requests
```

### Done

1. **Phase 0:** CSP-Report-Only baseline.
2. **Phase 1:** inline `onclick`/`onkeydown` removed from templates; delegated listeners in [generator.js](../generator.js).
3. **Phase 2:** Report-Only → **Enforce** (`Content-Security-Policy`). Lucide via `https://unpkg.com` allowlisted. Google Fonts hosts dropped (self-hosted fonts).
4. **Fonts:** self-host default ON (`BUILD_SELFHOST_FONTS=0` to opt out); privacy discloses `/assets/fonts/`.
5. **Phase 3 (script):** [success.html](../success.html) → [assets/success.js](../assets/success.js); `'unsafe-inline'` removed from `script-src`.

### Remaining

1. Remove `'unsafe-inline'` from `style-src` (nonces / move critical CSS) if needed.
2. Prefer self-hosting Lucide instead of unpkg.

### Paid PDF API hardening (1.6.0)

| Control | Detail |
|---------|--------|
| `SITE_URL` | **Required** when `VERCEL_ENV=production` — download URLs never built from `Host` / `X-Forwarded-Host` |
| Rate limits | Upstash Redis fixed window via [api/_lib/rate-limit.js](../api/_lib/rate-limit.js): `/api/download-link` 30/min per IP + 10/15min per `session_id`; `/api/download` 30/min per IP |
| Token length | `/api/download` rejects `t` longer than 2048 chars |
| Product resolve | [fulfillment.js](../api/_lib/fulfillment.js) prefers Stripe `line_items` price IDs over `metadata.product` |
| Webhook body | [stripe-webhook.js](../api/stripe-webhook.js) rejects bodies over 1 MiB before signature verify |

**Residual risk:** `GET /api/download-link?session_id=cs_…` stays unauthenticated by design (Stripe Payment Link → `success.html` poll). A leaked `session_id` is a short-lived capability to mint in-page download tokens. Mitigations: TLS, rate limits, 15‑minute in-page token TTL, Redis fulfillment binding. Post-promo candidates: single-use jti, refund auto-revoke.

**Ops health checks (production):**

- Stripe webhook URL **must** be `https://www.promptanatomy.help/api/stripe-webhook`. Apex POST 308 drops the body — fulfillment never runs. Healthy junk POST on www = **400** (signature), not 308.
- `GET /api/download?t=short` **503** = Redis rate-limit fail-closed (missing Upstash env). Healthy invalid token = **403**.

### Stebėjimas

- Browser DevTools console — CSP blocked resource warnings after deploy.
- Stripe checkout still must load `buy.stripe.com` / `js.stripe.com` frames.

---

## Static surface (1.6.2)

Vercel `outputDirectory` is `.` (repo root). Customer files must not include the working tree.

| Control | Detail |
|---------|--------|
| [`.vercelignore`](../.vercelignore) | Applied **before** build. Ignore only non-build files (`.github/`, `*.md`, `.cursorrules`, `.pa11yrc.json`). **Do not** ignore `scripts/`, `docs/`, `tests/`, `templates/`, `.eslintrc.json`, `api/**/*.js`, or `config/sot.json` — Vercel `npm test` needs them. |
| [vercel.json](../vercel.json) 404 | Public lock for build-needed trees: `/docs/`, `/scripts/`, `/tests/`, `/templates/`, `/api/_lib/`, `/api/_private/`, `/.github/`, `/:file.md`, `/vercel.json`, `/google-apps-script.js` → `/404.html` `statusCode: 404`. Function routes `/api/download`, `/api/download-link`, `/api/stripe-webhook` stay. |
| GitHub Pages | Deploy **retired**. Unpublish leftover `github.io` via Settings → Pages → None. |
| Allowlist | See [AGENT_SOT.md](AGENT_SOT.md) §6. GSC HTML + IndexNow `{key}.txt` stay public (protocol). `api/_lib` is not a public static JS URL. |

Local `npx serve .` still serves the full repo (dev). Production lock for `scripts/` / `docs/` / `tests/` / `templates/` is **404 redirects**, not `.vercelignore`.

---

## SEO + GEO + AI crawler policy

Detaliau — [docs/AGENT_SOT.md](AGENT_SOT.md) §1 + §6a. Trumpai:

- **Brand north star:** `Organization.url` + `llms.txt` Training hub → `promptanatomy.app`; šis site = Hire spoke (`WebSite.url` ant `.help`).
- [robots.txt](../robots.txt) — 16 AI UA įrašai (allow citation / disallow training carveouts / block training-only).
- [llms.txt](../llms.txt) ir [llms-full.txt](../llms-full.txt) — AI-friendly site map (Training hub → `.app`, Optional legal).
- IndexNow key — `INDEXNOW_KEY` konstanta [scripts/build-locale-pages.js](../scripts/build-locale-pages.js) (rotacija — taip pat atnaujinti [scripts/indexnow-ping.js](../scripts/indexnow-ping.js) ir [vercel.json](../vercel.json) header rule); host **www**.
- JSON-LD — `Organization` (HQ `.app`, ecosystem `sameAs`) + Person + WebSite + FAQPage (8) + 3× Product + WebPage `speakable` + `dateModified` + BreadcrumbList.
- CSP — **enforce** ([vercel.json](../vercel.json)); žr. aukščiau security skyrių.
