# Personalas – HR Hiring Prompts

**Pastaba:** npm paketo vardas repozitorijoje yra `di-promptu-biblioteka` ([package.json](package.json)); produktas / GitHub repo – „Personalas“.

Statinė HTML platforma: 10 HR atrankos promptų. Pasirinkti → kopijuoti → įklijuoti į ChatGPT, Claude ar Gemini. Anglų puslapis lokalizuotas JAV komandoms (`en-US`: valiuta, data, telefonas ir lokacijos pavyzdžiai).

**Live:** [https://ditreneris.github.io/personalas/](https://ditreneris.github.io/personalas/)

**Dokumentacija:** visų doc nuorodų indeksas – [docs/INDEX.md](docs/INDEX.md) (procesas: [docs/process/development.md](docs/process/development.md), saugumas: [docs/security.md](docs/security.md), LT/EN: [docs/language-guidelines-en-lt.md](docs/language-guidelines-en-lt.md)).

---

**Deploy:** GitHub Pages from `main` (Actions → Deploy to GitHub Pages).

**First-time setup:** enable Pages in [Settings → Pages](https://github.com/DITreneris/personalas/settings/pages) → **Build and deployment** → Source: **GitHub Actions**. After that, the “Deploy to GitHub Pages” workflow runs on every push to `main`.

```bash
git remote add personalas https://github.com/DITreneris/personalas.git
git push personalas main
```
