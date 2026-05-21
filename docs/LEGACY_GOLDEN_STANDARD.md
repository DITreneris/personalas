# Golden standard (legacy atskaita)

**Paskirtis:** Vienas operacinis sąrašas — ką **ne laužyti** keičiant turinį, CSS arba build. Detalus DS implementacijos planas — [design_systemv02.md](design_systemv02.md). Keliai, deploy, brand — [AGENT_SOT.md](AGENT_SOT.md). Agentų seka — [AGENTS.md](../AGENTS.md) §9.

**Paskutinis atnaujinimas:** 2026-05-21 (**DS v0.3.3** — dabartinė geriausia vieša versija)

---

## 0. Dabartinė produkcijos būsena (santrauka)

| Aspektas | Kanonas |
|----------|---------|
| Viešas UI | **EN-only** `/en/`; šaltinis [templates/index-lt.html](../templates/index-lt.html) → `npm run build` |
| Hero H1 | `marketing.hero.headline` — laikas iki naudos (**„in minutes“**), ne „6 phases“ H1'e |
| 6 fazės | Tik **free lane**: `#workflow-overview` chip'ai + `freeTier.ctaLabel` / `workflowOverview.title` |
| PDF proof | **Tik vartotojo trigger'is** — `<details class="pdf-see-inside">` + `#pdfPreviewDialog`; **jokio** auto-render specimen / expert testimonial |
| Per-kortelės highlights | **Pašalinti**; likęs vienintelis `<ul class="pdf-guide-highlights">` — **bundle** `#pdf-bundle-offer` |
| Bundle | `.pdf-bundle-body` (kairė kolona), `data-bundle-price-was`, `data-bundle-savings`; kainos iš SOT + [generator.js](../generator.js) |
| Struktūriniai testai | **355 PASS** (`tests/structure.test.js`) |

**Sąmoningai negrąžinti be produkto sprendimo:** `pdf-proof-inside`, `pdf-guides-social`, `pdf-expert-card*`, `hero-sample-link` (žr. §5.4, Phase D).

---

## 1. Kas yra „golden standard“

| Keičiate | Laikykitės |
|----------|------------|
| Prompt tekstai, antraštės | Prompt DOM §3 (id, klasės, `copyPrompt`, checkbox) |
| Vizualinė polish (spalvos, šešėliai) | DS §5–6; nekeisti layout be QA |
| Marketing copy, kainos, Stripe URL | [config/sot.json](../config/sot.json) + `npm run build` |
| Struktūra, JS elgsena | Šis dokumentas + atnaujinti [tests/structure.test.js](../tests/structure.test.js) |

**Taisyklė:** Jei sąmoningai laužote sutartį — pirmiausia atnaujinkite šį failą ir struktūrinius testus, tada CHANGELOG.

**CTA klasės (AGENTS.md §10):** neįvesti naujų pavadinimų — naudoti `.btn`, `.cta-button`, `.pdf-guide-cta`, `.pdf-bundle-cta`, `.btn--ghost`, `.form-submit` ir t. t.

---

## 2. Puslapio struktūra (PDF-first funnel)

Viešas EN puslapis (`en/index.html` po build) turi išlaikyti **sekos logiką**:

```
hero (primary CTA → #pdf-guides; H1 iš SOT — „in minutes“)
  → #page-lanes-nav (sticky: PDF guides | Free prompts)
  → page-lane--shop
      → objectives
      → #pdf-guides
          → H2 + lede
          → .pdf-guides-grid (Beginner + Advanced; Advanced = .pdf-guide-card--featured)
          → .pdf-guide-trust (#pdf-section-trust)
          → #pdf-bundle-offer (.pdf-bundle-offer; rodoma kai Stripe OK)
          → #pdf-guides-faq (Buyer FAQ)
          → .pdf-guides-after-purchase (.pdf-guides-free-bridge tik)
  → .pdf-sticky-cta (fixed; hidden kai hero arba #pdf-guides matomas)
  → page-lane--free
      → #free-prompts-band (#free-toolkit-title, #free-prompts-label)
      → #workflow-overview (6 fazės chip'ai — ne hero viduje)
      → instructions → Free prompt FAQ → progress → jump-nav
  → promptai (block1…block10, prompt1…prompt10)
  → community → footer
```

| Sutartis | Kodėl |
|----------|--------|
| Hero **neturi** `.header-phases` | Fazės — `#workflow-overview` free lane |
| `#pdf-guides` **prieš** free promptus | Konversijos KPI: PDF virš free tier |
| **Nėra** turinio tarp H2 ir grid | Phase D: jokio auto specimen / social proof virš kortelių |
| Buyer FAQ **po** grid + bundle, **prieš** free-bridge | Pirkimo objection'ai prie produkto |
| `.pdf-guides-after-purchase` | Tik **`pdf-guides-free-bridge`** — ne ekspertų kortelės, ne disclaimer dublius |
| Hero secondary CTA → `#free-prompts-label` | Nemokamas kelias nepraleidžia free band |
| `objectives` **prieš** `pdf-guides` | Problemos → produktas (shop lane) |
| Laisvojo lygio FAQ `<h2 id="faq-title">` | **„Free prompt FAQ“** (ne „Common questions…“) — atskirta nuo Buyer FAQ |

**Šaltinis turiniui:** [templates/index-lt.html](../templates/index-lt.html). **Neredaguoti ranka:** `en/index.html` — tik per build.

**PDF HTML fragmentas:** sinchronizuoti su [scripts/pdf-guides-section.fragment.html](../scripts/pdf-guides-section.fragment.html).

---

## 3. Prompt kortelės (DOM sutartis)

10 promptų: struktūra **`.prompt` > `.prompt-header` / `.prompt-body` / `.prompt-footer`**.

### 3.1 Privalomi identifikatoriai

| Elementas | Reikalavimas |
|-----------|----------------|
| Prompt ID | `prompt1` … `prompt10` |
| Anchor | `id="block1"` … `id="block10"` |
| Kopijavimas | `copyPrompt(...)` su teisingu `promptId` |
| Progresas | `.prompt-done` checkbox + `data-prompt-id` |
| Kodas | `.code-block` (≥10) |

### 3.2 Design System v1 — sąmoningi vizualiniai nukrypimai

- **`<p class="prompt-cta">`** — pašalinta iš `.prompt-footer`.
- **`.prompt .number` (PHASE badge)** — `display: none`; fazės kontekstas — `#workflow-overview` chip'ai.
- **`.info-box`** — CSS suplotas; markup išsaugotas.
- **`.prompt-footer`** — `display: flex` (Copy + Mark as done); tab eilė nepakeista.

---

## 4. Fazės ir workflow chip'ai

| Komponentas | Sutartis |
|-------------|----------|
| `#workflow-overview` | Atskira sekcija free lane; chip'ai `.header-phase-link[data-phase="1"]` … `6` |
| Chip CSS | **Scoped** `.workflow-overview .header-phase-link` |
| `generator.js` | Click: `is-active` + atidaro atitinkamą `.phase`, `scrollIntoView` (`prefers-reduced-motion`) |
| Prompt fazės | `article.prompt[data-phase="N"]` — atitinka chip numerį |
| Hero copy | **Ne** „6 phases“ H1 — struktūra žemiau (`How the 6-phase workflow works`, `Open the 6-phase workflow ↓`) |

---

## 5. PDF commerce blokas

### 5.1 Guide kortelės (Beginner / Advanced)

| Elementas | Sutartis |
|-----------|----------|
| Cover | `figure.pdf-guide-card-cover` + `/assets/pdf-covers/{beginner\|advanced}.png` |
| Specs | `ul.pdf-guide-specs` (pages, PDF, English, updated) |
| **See inside** | Vienas `<details class="pdf-see-inside" data-see-inside="beginner\|advanced">` — **collapsed by default** |
| See inside turinys | `__thumbs` (preview mygtukai) + `__open-all` (`data-preview-trigger`) + `__chapter-list` (`data-toc-list`) |
| **Nėra** | `.pdf-guide-highlights` ant kortelės, `.pdf-guide-toc-details`, `.pdf-guide-preview-btn` |
| Kaina | `.pdf-guide-price-row` (was + new) |
| Sample | `a.pdf-guide-sample-link` + `data-sample-link` |
| CTA | `.pdf-guide-cta` + `data-product`, `data-analytics="pdf_cta_click"`; Stripe URL iš SOT |
| Featured | Advanced: `.pdf-guide-card--featured` (gold inset + navy border) |

### 5.2 Preview modal

| Elementas | Sutartis |
|-----------|----------|
| Dialog | `#pdfPreviewDialog` |
| Trigger | `[data-preview-trigger="beginner\|advanced"]` — thumb `<button class="pdf-see-inside__thumb">` arba `a.pdf-see-inside__open-all` |
| Puslapiai | SOT `previewPages`: beginner `[6,8,9]`, advanced `[10,15,17]`; fallback diske — **ne** `[2,3,4]` |
| Fetch | `loadSotConfig()` → **`/config/sot.json`** (absoliutus kelias iš `/en/`) |
| Init eilė | `initPdfSeeInside` **prieš** `initPdfPreviewDialog`; event delegation ant `#pdf-guides` |
| Klaida | `.pdf-preview-error` kai PNG nerastas |

### 5.3 Bundle upsell (`#pdf-bundle-offer`)

| Elementas | Sutartis |
|-----------|----------|
| Matomumas | `hidden` iki `initStripeLinks` (jei `bundle.stripePaymentLink` OK) |
| Antraštė / lede | Centruota (`.pdf-bundle-offer { text-align: center }`) |
| Turinys | `.pdf-bundle-body` — `max-width: 24rem`, `text-align: left` (bullets + kaina kartu) |
| Highlights | Vienintelis `ul.pdf-guide-highlights` + `data-guide-highlights="bundle"`; turinys iš `pdfGuides.bundle.highlights` |
| Kaina | `data-bundle-price-was`, `data-bundle-price`; JS atnaujina iš `priceWas` / `price` |
| Sutaupymas | `p.pdf-bundle-savings` + `data-bundle-savings` — `Save $X.XX` (was − price) |
| CTA | `.pdf-guide-cta.pdf-bundle-cta` + `data-product="bundle-pdf"` |

### 5.4 Pašalinta (Phase D — negrąžinti be sąmoningo PR)

Šie pattern'ai **neturi** būti `en/index.html` ar `sot.json` `marketing.pdfSection`:

- `pdf-proof-inside`, `hero-sample-link`, `pdf-guides-social`, `pdf-expert-card*`
- `marketing.pdfSection.proofInside`, `expertScenarios`

Struktūriniai testai: Phase D **negative regression** (11 assert'ų).

### 5.5 Kiti PDF sutarčiai

| Elementas | Sutartis |
|-----------|----------|
| `.pdf-guide-cta` | `--cta-primary-bg`, `--text-on-accent`, `:visited`, `--ring-focus` |
| Buyer FAQ | `{{SOT_BUYER_FAQ_HTML}}` build metu; `<details class="faq-details">` be `open` |
| Disclaimer | Tik footer `.footer-disclaimer` + `{{SOT_DISCLAIMER}}` |
| Bundle produktas | beginner + advanced; $15.99 / was $17.98 (SOT) |

---

## 6. CSS ir Design System (v0.2 → v0.3.3)

### 6.1 Kur redaguoti

| Failas | Turinys |
|--------|---------|
| [assets/styles.css](../assets/styles.css) | `:root` tokenai, `.btn`, `.btn--ghost` |
| [assets/landing.css](../assets/landing.css) | Visi landing komponentai, `.pdf-see-inside`, `.pdf-bundle-*` |
| [templates/index-lt.html](../templates/index-lt.html) | HTML; **be** inline `<style>` |

Po pakeitimų: **`npm run build`** → **`npm test`**.

### 6.2 Tokenai ir draudimai

- **Nenaudoti** deprecated alias'ų: `--orange-light`, `--shadow-card*`, ir t. t. (v0.3.1+ guard'ai).
- **Focus** šviesus fonas: `var(--ring-focus)`; tamsus hero: `var(--ring-focus-on-dark)`.
- **Radius / motion / lift / reduced-motion** — kaip DS v0.2.2–v0.2.5 (žr. [design_systemv02.md](design_systemv02.md)).
- **Hero sentence case:** `text-transform: none` ant H1, subhead, price teaser; **U.S.** headline'e; kaina tik `priceTeaser`, ne subhead.
- **Šešėliai / gradients / navy borders / sticky glass** — v0.3.0 taisyklės galioja.

### 6.3 Surface ladder (v0.2.1)

| Komponentas | Fonas / elevation |
|-------------|-------------------|
| `.pdf-guides` | `--surface-2` |
| `.pdf-guide-card` | `--surface-1` + `--shadow-soft` |
| `.pdf-guide-card--featured` | Navy + gold inset; hover `--shadow-elevated` |
| `.pdf-bundle-offer` | `--surface-1` + `--shadow-soft` + accent border |
| `.pdf-see-inside__body` | `--surface-2` + `border-subtle` |
| Workflow chip default | `--surface-2` |
| Chip active | `--surface-1`, navy border |

### 6.4 Sticky overlap & anchor clearance (v0.2.2)

- Anchor target'ai: `scroll-margin-top: clamp(72px, 12vh, 96px)`.
- `.page-lanes-nav` ir `.pdf-sticky-cta`: glass + `@supports` fallback; sticky CTA `env(safe-area-inset-bottom)`.

---

## 7. Runtime ([generator.js](../generator.js))

Nelaužyti be QA:

| Funkcija | Paskirtis |
|----------|-----------|
| `window.copyPrompt` | Debounced kopijavimas |
| Phase accordion | `.phase`, `.phase-header`, `.is-open` |
| `.header-phase-link` | Scroll į fazę |
| `initPdfSeeInside` | Thumbs, chapters, meta „See inside · N pages + M chapters“ |
| `initPdfGuideHighlights` | **Tik** `data-guide-highlights="bundle"` |
| `initPdfPreviewDialog` | Modal + `[data-preview-trigger]` |
| `initStripeLinks` | Stripe URL + bundle `hidden` + kainos + savings |
| `loadSotConfig` | `fetch('/config/sot.json')` |
| `initPdfStickyCta` | IntersectionObserver hero + pdf-guides |
| Analytics | `data-analytics` + `trackEvent()` |

---

## 8. QA prieš merge

1. **`npm test`** — 355+ structure assert'ų, HTML/JS lint, `pdf:validate`.
2. **Prompt audit:** `prompt1`…`prompt10`, `block1`…`block10`, `aria-label`, `onclick` argumentai.
3. **Viešas brand:** `rg -i "personalas|series no"` (išskyrus `node_modules`, vidinę doc).
4. **Rankinis smoke `/en/`:**
   - Hero → PDF grid; bundle bullets/kaina suderinti
   - **See inside ▶** → thumbs → modal; **Open all pages**
   - 1-page sample PDF atsisiuntimas
   - Workflow chip'ai → fazė
   - Pirmo prompto kopijavimas
5. **Phase D regression:** puslapyje nėra `pdf-proof-inside` / `pdf-expert-card`.
6. **Release:** pa11y pagal [AGENT_SOT.md](AGENT_SOT.md) §6.

### Struktūriniai testai (žymūs guard'ai)

- DS v0.3.3 Phase B: `pdf-see-inside` ×2, `pdf-guide-preview-btn` absent, `pdf-guide-highlights` count **1** (bundle)
- DS v0.3.3 Phase D: removed DOM/SOT patterns absent
- GEO: robots, sitemap, JSON-LD, llms.txt, manifest
- PDF preview: fallbacks `6/8/9` ir `10/15/17`, absolute SOT fetch

---

## 9. Susiję dokumentai

| Dokumentas | Kada skaityti |
|------------|----------------|
| [design_systemv02.md](design_systemv02.md) | DS PR, token migracija |
| [AGENT_SOT.md](AGENT_SOT.md) | Keliai, build, deploy, Stripe, GEO |
| [language-guidelines-en-lt.md](language-guidelines-en-lt.md) | EN viešas copy, brand |
| [DOCUMENTATION.md](DOCUMENTATION.md) | Doc atnaujinimai prieš merge |
| [CHANGELOG.md](../CHANGELOG.md) | Kas išleista / Unreleased |

---

## 10. Revision history

| Data | Versija | Pastabos |
|------|---------|----------|
| 2026-05 | v1 | Prompt kompresija, PDF CTA visited fix |
| 2026-05-19 | v0.2 | `landing.css`, tokenai, inline CSS pašalintas |
| 2026-05-20 | v0.2.1–v0.2.5 | Surface, sticky, motion, focus, `:has` done state |
| 2026-05-20 | v0.2.6–v0.3.2 | Expert scenarios + proof-inside (vėliau **pašalinta** Phase D) |
| 2026-05-20 | v0.3.0 | Token harmonization, glass sticky, fluid H1 |
| 2026-05-20 | v0.3.3 Phase B | `pdf-see-inside`; per-card highlights/toc/preview-btn removed |
| 2026-05-20 | v0.3.3 Phase C | Specimen-first ( **revert** Phase D) |
| 2026-05-20 | v0.3.3 Phase D | **Dabartinė PDF sekcijos seka**; no auto specimen/social proof |
| 2026-05-21 | v0.3.3+ | Bundle `.pdf-bundle-body` + savings; hero H1 „in minutes“; 355 tests |
| 2026-05-21 | **Golden standard sync** | Šis failas suderintas su geriausia veikiančia `/en/` versija |

**Istoriniai komponentai (archyvas, ne golden):** `.pdf-expert-cards`, `.pdf-proof-inside`, `.pdf-guide-preview-btn`, per-card `.pdf-guide-highlights` — aprašyti CHANGELOG, negrąžinti be naujo ADR/PR.
