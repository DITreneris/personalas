# Personalas – HR atrankos promptai

Statinė HTML platforma: 10 promptų atrankai (skelbimas, pokalbiai, pasiūlymas ir kt.). Pasirinkti → kopijuoti → įklijuoti į ChatGPT/Claude.

**Live:** [https://ditreneris.github.io/personalas/](https://ditreneris.github.io/personalas/)

---

**Deploy:** GitHub Pages iš `main` (Actions → Deploy to GitHub Pages).

**Pirmą kartą** – įjunk Pages: [Settings → Pages](https://github.com/DITreneris/personalas/settings/pages) → **Build and deployment** → Source: **GitHub Actions**. Po to workflow „Deploy to GitHub Pages“ veiks ant kiekvieno push į `main`.

```bash
git remote add personalas https://github.com/DITreneris/personalas.git
git push personalas main
```

## Contributor workflow

Source of truth:

- Edit the root source files (`index.html`, `privatumas.html`, `generator.js`) and the build script (`scripts/build-locale-pages.js`).
- Do **not** manually edit generated locale outputs in `lt/*` or `en/*` unless you are inspecting build output.
- Run `npm run build` after source changes so Lithuanian and English generated pages stay in sync.
- Shared visual tokens and primitive page styles live in `assets/styles.css`; prefer reusing those tokens/classes before adding page-specific CSS.
