# LT / EN ir prekės ženklas – Personalas



## Source of truth (SOT): viešas produktas = anglų



Viena nuosekli taisyklė visiems agentams ir PR peržiūrai:



| Sritis | Kanonas |

|--------|---------|

| **Viešas frontend (UI)** | **`en-US`**, URL **`/en/`** – tai numatytoji lankytojo patirtis JAV rinkai. |

| **Deploy / produkcijos „default“** | Šaknis **`/`** ir **`/privacy.html`** – EN vartai (redirect arba nuorodos į **`/en/`**). Post-deploy ir rankinis QA – pirmiausia **`/en/`** (žr. [DEPLOYMENT.md](../DEPLOYMENT.md)). |

| **SEO (`<head>`)** | Kanoninis URL, **`x-default` hreflang**, vieši meta (`title`, `description`, OG, Twitter) anglų kalba kanoniniam keliui; generuoja [scripts/build-locale-pages.js](../scripts/build-locale-pages.js). |

| **OG paveikslėlis** | Vienas bendras **`images/og-default.png`** – **anglų** tekstas (generuoti: `npm run generate:og`). |

| **LT turinys (authoring)** | [templates/index-lt.html](../templates/index-lt.html) – redagavimo šaltinis; **nesiunčiamas** kaip LT produktas. Privatumas: [templates/privacy.html](../templates/privacy.html) (ne `privatumas-lt.html` – deprecated). |

| **Viešas prekės ženklas** | **`Prompt Anatomy`** (`config/sot.json` → `brand.publicName`). Žr. sekciją *Viešas prekės ženklas ir locale* žemiau. |

| **Pozicionavimas / KPI** | [config/sot.json](../config/sot.json) – `positioning.primaryKpi` = **`pdf`**; **mokami PDF** – pagrindinis konversijos tikslas; hero primary CTA → `#pdf-guides`. |



**Agentų operacinis SOT:** [AGENT_SOT.md](AGENT_SOT.md). Rolės – [AGENTS.md](../AGENTS.md).



## Numatytoji kalba ir URL



- **Produktas vartotojui (US):** pagrindinė patirtis – **anglų (`en-US`)**, kanoninis įėjimas **`/en/`**, `x-default` hreflang → **`/en/`**.

- **Šaknies `/` ir `/privacy.html`:** tik EN vartai (peradresavimas / nuorodos į `/en/`). Viešame UI **nėra** nuorodos į lietuvių kalbą.

- **`/lt/*` URL:** produkcijoje **permanent redirect** į atitinkamą `/en/*` ([vercel.json](../vercel.json)). **Nėra** atskiro LT puslapio testavimui deploy’e.

- **LT šaltinis:** [templates/index-lt.html](../templates/index-lt.html) – build generuoja tik **`en/index.html`**, **`en/privacy.html`** ([scripts/build-locale-pages.js](../scripts/build-locale-pages.js) – `stripLanguageSwitcher()` pašalina `lt-only-qa-nav`).



## Sluoksniai (santrauka)



| Sluoksnis | Paskirtis |

|-----------|-----------|

| `/en/` | Viešas produktas JAV rinkai |

| `templates/index-lt.html` | Authoring (LT tekstas → EN per build) |

| `/privacy.html` | EN vartas → `en/privacy.html` |

| Privatumas (grįžimas) | Statinis `href="index.html"` iš `en/privacy.html` |



## Viešas prekės ženklas ir locale (agentams – privaloma)



| Taisyklė | Detalė |

|----------|--------|

| **Viešas brand** | **Prompt Anatomy** — `/en/`, PDF, terms, privacy, success, el. laiškai |

| **Draudžiama viešame UI** | „Personalas“, „Series No. 3“, „Spin-off“, „Promptų anatomija“, lietuviškos raidės (ąčę…) |

| **Vidinis** | `product.name: "Personalas"` repo/SOT — **ne** rodyti lankytojui |

| **PDF viršeliai** | Redaguoti `docs/pdf-source/*.html` → `npm run pdf:export` → `npm run pdf:covers` |

| **Greita patikra** | `rg -i "personalas|series no|spin-off|promptų" en/ terms.html success.html templates/privacy.html docs/pdf-source` |



## Kanonas



- **Repo / vidinis projektas:** Personalas (ne „biblioteka“, ne „marketingas“ dokumentacijoje).

- **Viešas vardas klientui:** **Prompt Anatomy** (žr. `brand.publicName` SOT).

- **LT:** produktą apibūdinkite kaip **promptų rinkinį** / **DI promptus HR atrankai**, ne „biblioteką“.

- **EN (`en-US`):** naudokite **US hiring prompts** arba panašiai; vengkite **„prompt library“** kaip prekės ženklo pavadinimo.



## Build



Anglų puslapiai generuojami iš LT šablonų – žr. [scripts/build-locale-pages.js](../scripts/build-locale-pages.js). Po `applyEnPromptUi` EN indeksui taikomas `stripLanguageSwitcher()` (pašalina `lt-only-qa-nav` ir seną `lang-switcher`).

