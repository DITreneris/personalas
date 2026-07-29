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

### Stebėjimas

- Browser DevTools console — CSP blocked resource warnings after deploy.
- Stripe checkout still must load `buy.stripe.com` / `js.stripe.com` frames.

---

## SEO + GEO + AI crawler policy

Detaliau — [docs/AGENT_SOT.md](AGENT_SOT.md) §1 + §6a. Trumpai:

- **Brand north star:** `Organization.url` + `llms.txt` Training hub → `promptanatomy.app`; šis site = Hire spoke (`WebSite.url` ant `.help`).
- [robots.txt](../robots.txt) — 16 AI UA įrašai (allow citation / disallow training carveouts / block training-only).
- [llms.txt](../llms.txt) ir [llms-full.txt](../llms-full.txt) — AI-friendly site map (Training hub → `.app`, Optional legal).
- IndexNow key — `INDEXNOW_KEY` konstanta [scripts/build-locale-pages.js](../scripts/build-locale-pages.js) (rotacija — taip pat atnaujinti [scripts/indexnow-ping.js](../scripts/indexnow-ping.js) ir [vercel.json](../vercel.json) header rule); host **www**.
- JSON-LD — `Organization` (HQ `.app`, ecosystem `sameAs`) + Person + WebSite + FAQPage (8) + 3× Product + WebPage `speakable` + `dateModified` + BreadcrumbList.
- CSP — **enforce** ([vercel.json](../vercel.json)); žr. aukščiau security skyrių.
