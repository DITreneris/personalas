# Archyvuoti vienkartiniai skriptai

Šie failai **nėra** `npm test` / CI dalis. Jie buvo naudoti istorinėms migracijoms (DS v0.2, PDF-first layout). **Nepaleiskite** ant dabartinio `templates/index-lt.html` be aiškaus poreikio — gali sugadinti layout.

| Skriptas | Paskirtis |
|----------|-----------|
| `apply-ds-v02.js` | DS v0.2 CSS ištraukimas iš šablono (vienkartinis) |
| `reorder-pdf-first-layout.js` | PDF sekcijos perkėlimas virš objectives |
| `patch-pdf-section-html.js` | `#pdf-guides` HTML sync iš fragmento |
| `patch-pdf-guides-section.js` | Alternatyvus PDF sekcijos patch |

Rankinis PDF HTML sync: redaguokite [../pdf-guides-section.fragment.html](../pdf-guides-section.fragment.html) ir [../../templates/index-lt.html](../../templates/index-lt.html) kartu (žr. [docs/LEGACY_GOLDEN_STANDARD.md](../../docs/LEGACY_GOLDEN_STANDARD.md)).
