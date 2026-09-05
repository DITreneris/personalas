# Gyvas testavimas – Personalas

Po deploy (žr. [DEPLOYMENT.md](../DEPLOYMENT.md)) patikrinkite:

1. **Šaknis** `/` – EN vartas (redirect / meta refresh į `/en/`).
2. **`/en/`** – pagrindinis QA: promptai, PDF sekcija, JAV formatų pavyzdžiai (žr. [tests/structure.test.js](../tests/structure.test.js)).
   - **Mobile (≤768px):** po hero **nėra** bullet sąrašo „PDF guides / Free prompts“ — tik objectives kortelė; navigacija per hero mygtukus.
   - **Desktop:** po hero matoma sticky `#page-lanes-nav` (pill: PDF guides | Free prompts).
   - **Network:** `landing.css?v=` ir `styles.css?v=` — 200 (cache bust po release).
3. **`/privacy.html`** ir **`/en/privacy.html`** – privatumo politika (Stripe, Resend, CA rights).
4. **`/terms.html`**, **`/success.html`** – sąlygos ir post-purchase (be `session_id` – tik UI).
5. **OG / canonical** – naršyklės devtools arba [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/).
6. **Mokamas PDF (Vercel):** testinis pirkimas pagal [MUST_TODO.md](../MUST_TODO.md) QA checklist.

**Pastaba:** `/lt/*` URL produkcijoje nukreipia į `/en/*` — nėra atskiro LT puslapio.

---

## Mobile matrix (iOS + Android)

Po UI / sticky / CSS pakeitimų (ir po deploy) patikrinkite realiuose įrenginiuose arba bent Chrome DevTools + viename fiziniame telefone.

| # | Patikra | iOS Safari | Android Chrome |
|---|---------|------------|----------------|
| M1 | 360–430px: nėra horizontalaus scroll visame puslapyje | | |
| M2 | Scroll po hero → `.pdf-sticky-cta` matomas; toast po **Copy** lieka **virš** sticky juostos | | |
| M3 | Sticky matomas: footer / community CTA nėra po juosta (`body.has-pdf-sticky-cta`) | | |
| M4 | Landscape: sticky CTA neįstringa į notch / home indicator (L/R/bottom safe-area) | | |
| M5 | Copy bent 1 promptą (clipboard + toast) | | |
| M6 | Pinch-zoom **veikia** (nėra `user-scalable=no` / `maximum-scale=1`) | | |
| M7 | Modal / PDF preview (jei atidaromas): turinys netrūkinėja po Safari URL bar (`dvh`) | | |
| M8 | Stripe Buy → checkout → success kelias (gyvas) — žr. [MUST_TODO.md](../MUST_TODO.md) QA | | |

**Minimalus įrenginių rinkinys:** 1× iPhone Safari, 1× Android Chrome; pageidautina + mažas ekranas (SE klasė) ir lėtesnis tinklas Checkout’ui.

## Žurnalas

| Data | Aplinka | Rezultatas |
|------|---------|------------|
| 2026-09-05 | Vercel Production | Beginner live buy: `success.html` ready + masked email + Download + Redis fulfillment; poll `/api/download-link` 200. |
| 2026-09-05 | Vercel Production | Advanced live buy 09:21 EEST: Stripe receipt #1580-6052 ($11.99 + LT 21% VAT). Poll 200 `productId=advanced` + Redis fulfillment. |
| 2026-09-05 | Stripe Dashboard | Webhook replay www `.help`: Beginner `evt_1UCCsl…` 09:43 + Advanced `evt_1UCCyo…` 09:43 — both 200 `already_fulfilled`. **Promo go.** GSC spoke indexing still open. |
