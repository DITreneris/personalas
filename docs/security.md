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
| `Content-Security-Policy-Report-Only` | (žr. žemiau) | CSP baseline — Report-Only kol egzistuoja inline event handler'iai |

## CSP promotion path

CSP yra **Report-Only** (browser logs violations, bet nieko neblokuoja):

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://*.vercel-insights.com https://plausible.io;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: https:;
connect-src 'self' https://*.vercel-insights.com https://vitals.vercel-insights.com https://api.stripe.com;
frame-src https://buy.stripe.com https://js.stripe.com;
base-uri 'self';
form-action 'self' https://buy.stripe.com;
frame-ancestors 'none';
upgrade-insecure-requests
```

### Promotion blokeriai (iki **NE** flip'inti į enforce)

1. **Inline `onclick=` / `onkeydown=` handler'iai** [en/index.html](../en/index.html) ir [templates/index-lt.html](../templates/index-lt.html) (e.g. `activateCodeBlock(this)` ant `.code-block`). Su `script-src 'unsafe-inline'` jie veikia, bet `'unsafe-inline'` reikia pašalinti prieš realią CSP apsaugą. Refactor — perkelti į `addEventListener` per [generator.js](../generator.js); separate ticket.
2. **Inline `<style>` block'ai** [success.html](../success.html), [404.html](../404.html) — `style-src 'unsafe-inline'` reikia kol pašalinti / perkelti į `assets/styles.css`.

### Migration sequence

1. **Phase 0 (DONE):** CSP-Report-Only deploy'intas; monitor Vercel logs 7+ dienų. Jei reports clean — pereinama prie Phase 1.
2. **Phase 1:** refactor'inti inline `onclick`/`onkeydown` → `addEventListener`. Test'as: `npm test` + manual prompt copy-paste.
3. **Phase 2:** flip Report-Only → enforce (`Content-Security-Policy` header'is). Stripe checkout testas privalo praeiti (frame-src / form-action turi white'list'inti `buy.stripe.com`).
4. **Phase 3:** ištrinti `'unsafe-inline'` iš `script-src` ir `style-src` po Phase 1+2 stabilizavimo. Pridėti nonce'us jei reikia.

### Stebėjimas

- Vercel logs — search `csp-report` violations (jei vėliau pridėsime `report-uri` direktyvą).
- Browser DevTools console — `Content Security Policy: ... would have been blocked` warning'ai (Report-Only režime).

---

## SEO + GEO + AI crawler policy

Detaliau — [docs/AGENT_SOT.md](AGENT_SOT.md) §6a. Trumpai:

- [robots.txt](../robots.txt) — 16 AI UA įrašai (allow citation / disallow training carveouts / block training-only).
- [llms.txt](../llms.txt) ir [llms-full.txt](../llms-full.txt) — AI-friendly site map.
- IndexNow key — `INDEXNOW_KEY` konstanta [scripts/build-locale-pages.js](../scripts/build-locale-pages.js) (rotacija — taip pat atnaujinti [scripts/indexnow-ping.js](../scripts/indexnow-ping.js) ir [vercel.json](../vercel.json) header rule).
- JSON-LD payload'ai — Organization + Person + WebSite + FAQPage + 3× Product + WebPage.speakable + BreadcrumbList.
