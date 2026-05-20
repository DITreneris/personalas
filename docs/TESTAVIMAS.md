# Gyvas testavimas – Personalas

Po deploy (žr. [DEPLOYMENT.md](../DEPLOYMENT.md)) patikrinkite:

1. **Šaknis** `/` – EN vartas (redirect / meta refresh į `/en/`).
2. **`/en/`** – pagrindinis QA: promptai, PDF sekcija, JAV formatų pavyzdžiai (žr. [tests/structure.test.js](../tests/structure.test.js)).
3. **`/privacy.html`** ir **`/en/privacy.html`** – privatumo politika (Stripe, Resend, CA rights).
4. **`/terms.html`**, **`/success.html`** – sąlygos ir post-purchase (be `session_id` – tik UI).
5. **OG / canonical** – naršyklės devtools arba [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/).
6. **Mokamas PDF (Vercel):** testinis pirkimas pagal [MUST_TODO.md](../MUST_TODO.md) QA checklist.

**Pastaba:** `/lt/*` URL produkcijoje nukreipia į `/en/*` — nėra atskiro LT puslapio.

Žurnalas: įrašykite datą, aplinką (Vercel / GitHub Pages), rezultatą.
