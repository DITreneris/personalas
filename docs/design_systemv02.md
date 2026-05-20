# Design System v0.2 — Implementation Plan

**Status:** Draft (ready for execution)  
**Version:** 0.2.0-plan  
**Date:** 2026-05-19  
**Audience:** UI/UX, Content (micro-copy only), QA, Orchestrator  
**Related:** [LEGACY_GOLDEN_STANDARD.md](LEGACY_GOLDEN_STANDARD.md), [AGENT_SOT.md](AGENT_SOT.md), [AGENTS.md](../AGENTS.md) §9

---

## 1. Purpose

Finish the **token migration started in v1** without redesigning Prompt Anatomy. v0.2 is **micro-polish only**: same layout, same DOM contracts, same navy + gold brand, fewer visual inconsistencies.

| Goal | Metric of success |
|------|-------------------|
| One shadow vocabulary | ≥90% card/CTA shadows use `--shadow-soft` / `--medium` / `--elevated` / `--shadow-cta` |
| One focus ring on light surfaces | `--ring-focus` on all interactive elements except hero-on-navy |
| Retire misleading tokens | Zero new usages of `--orange-light`, `--orange`, `--blue-light`, `--community-cta-green*` in templates |
| One primary CTA color | All “buy / submit / copy” primaries use `--accent-primary` or `--cta-primary-bg` |
| Shorter path to first prompt | Hero secondary CTA no longer looks disabled; optional FAQ collapse |

**Non-goals (explicit):** new layout, new illustrations, new animation, new font, LT public pages, prompt text rewrites, Stripe/SOT business logic changes.

---

## 2. Constraints (do not break)

### 2.1 Build & edit paths

| Edit (source) | Generated (do not hand-edit) |
|---------------|------------------------------|
| `templates/index-lt.html` | `en/index.html`, root `index.html` (gateway only) |
| `templates/privacy.html` | `en/privacy.html`, `privacy.html` |
| `assets/styles.css` | Linked by all pages that import it |
| `generator.js` | Runtime only |
| `scripts/build-locale-pages.js` | Strips `/* */` and `<!-- -->` from built HTML |

**After every template/CSS change:** `npm run build` then `npm test`.

### 2.2 DOM / JS contracts (golden standard)

Do **not** rename or remove:

- Prompt IDs: `prompt1` … `prompt10`, anchors `block1` … `block10`
- Classes: `.prompt`, `.prompt-header`, `.prompt-body`, `.prompt-footer`, `.code-block`, `.btn`, `.prompt-done`
- Section order enforced by `tests/structure.test.js`: hero → `#page-lanes-nav` → shop lane (objectives → `#pdf-guides`) → free lane (free band → `#workflow-overview` → instructions → FAQ → progress → jump-nav) → prompts → community → footer
- `.pdf-guide-cta` must keep `:link/:visited/:hover/:active` + `--text-on-accent` + `--ring-focus` (regression tested)

### 2.3 Brand (public EN)

- Keep **Prompt Anatomy** only on shipped HTML (`/en/`, terms, success, privacy).
- No new “Personalas”, “Series No. 3”, or LT diakritikos in `en/*`.

---

## 3. Current state (v0.1 baseline)

### 3.1 What already works — preserve

- Hero: navy gradient + radial highlight + grain (`templates/index-lt.html` `.header`)
- Token file: `assets/styles.css` (`:root` v1 additions: `--surface-*`, `--fs-*`, `--ring-focus`, `--gradient-cta-hover`, `--shadow-cta`)
- Accessibility: skip link, 44px targets, `prefers-reduced-motion`, pa11y WCAG2AA
- PDF Buy CTA pattern (reference implementation for all primaries)
- Prompt card compression (v1): hidden `.number`, flattened `.info-box`, flex `.prompt-footer`

### 3.2 Known debt (v0.2 targets)

| Issue | Location | Count (approx.) |
|-------|----------|-----------------|
| Deprecated color aliases still used | Inline `<style>` in `templates/index-lt.html` | 18+ rules |
| Raw `font-size: Npx` | Same inline block | ~100 |
| Duplicate `.btn` vs `assets/styles.css` | Template + shared CSS | 2 definitions |
| Multiple focus ring colors | Template | 5 variants |
| Literal `box-shadow` | Template | 15+ |
| `transition: all` | Template | 4 |
| Hero outline CTA double-dim | `.cta-button-outline` + `opacity: 0.95` | 1 |
| Missing `.hero-price-teaser` styles | HTML only | 1 |
| Build strips comments, leaves blank lines | `build-locale-pages.js` L929–930 | cosmetic |
| `form-submit` uses `--accent-dark` not navy | Modal CSS | 1 |

---

## 4. Target architecture (v0.2)

### 4.1 Token layers

```
assets/styles.css (:root)
  ├── Brand (unchanged): --accent-primary, --accent-gold, hero gradients
  ├── Surfaces: --surface-0 … --surface-3, --bg-subtle
  ├── Typography: --fs-xs … --fs-display, --leading-*
  ├── Elevation: --shadow-soft | --medium | --elevated | --shadow-cta | --shadow-toast | --shadow-modal | --shadow-sticky
  ├── Focus: --ring-focus (light UI); hero exception: 3px solid white
  ├── Semantic: --success (alias --green), --error, --tertiary (info only)
  └── Deprecated (alias only until P2 removal): --orange-light → --surface-3, etc.
```

### 4.2 Component model (CTA)

| Modifier | Use | Base |
|----------|-----|------|
| `.btn` | Copy prompt, generic primary | `assets/styles.css` |
| `.btn--ghost` | PDF preview, outline on light | New in v0.2 (optional P1) |
| `.btn--full` | Modal submit, full-width card CTA | New in v0.2 (optional P1) |
| `.cta-button` / `.cta-button-outline` | Hero only | Keep separate (white pill / glass) |
| `.pdf-guide-cta` | Stripe buy | Keep as-is (tested) |

**Rule:** No new CTA class names after v0.2.

### 4.3 Typography scale (enforce)

| Role | Token | px |
|------|-------|-----|
| Hero H1 | `--fs-display` (optional P2; keep 52px until then) | 48–52 |
| Section H2 | `--fs-2xl` | 24 |
| Card title / H3 | `--fs-xl` | 20 |
| Prompt title | `--fs-3xl` | 28 |
| Body | `--fs-md` | 16 |
| Secondary | `--fs-sm` | 14 |
| Micro / badge | `--fs-xs` | 12 |

**Remove in P1/P2:** 11, 13, 15, 17, 19, 22px one-offs.

#### 4.3.1 Hero typography (navy `.header`)

| Element | Case | CSS |
|---------|------|-----|
| `.badge` | Uppercase (brand chip only) | `.badge { text-transform: uppercase; }` |
| `h1`, subhead `p`, `.hero-price-teaser`, hero CTAs | **Sentence case** (match SOT DOM text) | `text-transform: none` on each; never group `h1` with badge meta styles |
| `.hero-price-teaser` | Muted secondary | `--fs-sm`, `opacity: ~0.82` |

**Ban:** a shared rule like `.header h1, .header p { text-transform: uppercase; }` — it overrides SOT copy and breaks **U.S.** readability. Regression: [tests/structure.test.js](../tests/structure.test.js) hero CSS asserts.

### 4.4 Shadow levels

| Level | Token | Use |
|-------|-------|-----|
| Rest | `--shadow-soft` | Cards, phases, FAQ, jump-nav |
| Hover | `--shadow-medium` | Card hover, phase header hover |
| Hero / modal | `--shadow-elevated` | `.header`, `.modal` |
| Primary button | `--shadow-cta` | `.btn`, `.pdf-guide-cta` |
| Toast | `--shadow-toast` (new) | `.toast` |
| Sticky bar | `--shadow-sticky` (new) | `.pdf-sticky-cta` |

### 4.5 Color semantics

| Token | Meaning |
|-------|---------|
| `--accent-primary` | Primary actions, links on light |
| `--accent-gold` | Focus ring, progress fill, active phase pip |
| `--accent-dark` | H2 on light surfaces, outline secondary text |
| `--tertiary` | Passive info: `.faq-panel` border-left only |
| `--success` | Toast, form success, “copied” state border |
| `--error` | Form validation only |

**Ban:** `rgba(46, 158, 126, …)` on `:hover` (FAQ summary today).

---

## 5. File change map

### 5.1 Always touch

| File | Changes |
|------|---------|
| `assets/styles.css` | New tokens; extend `.btn`; optional modifiers |
| `templates/index-lt.html` | Inline `<style>` bulk of v0.2 |
| `scripts/build-locale-pages.js` | Collapse extra blank lines in `<style>` after comment strip |
| `docs/LEGACY_GOLDEN_STANDARD.md` | Add “Design System v0.2” subsection when P0 merges |

### 5.2 Touch in P1+ only

| File | Changes |
|------|---------|
| `generator.js` | Phase chip → scroll + open matching `.phase` |
| `templates/privacy.html` | Align notice radius with `--r-badge` (optional) |
| `success.html` / `terms.html` | Import shared tokens only if duplicating `:root` (P2) |
| `tests/structure.test.js` | Optional: fail on deprecated token in `en/index.html` |

### 5.3 Do not touch in v0.2

- Prompt English/LT body text in `<pre>` (Content scope)
- `config/sot.json` prices/Stripe URLs
- `api/*`, PDF HTML sources (separate print CSS)

---

## 6. PR roadmap

Execute as **small, reviewable PRs**. Prefix: `[UI]`.

### PR-1 — P0: Quick wins (1 day)

**Branch suggestion:** `ui/ds-v02-p0-tokens-hero`

#### 6.1.1 `assets/styles.css`

Add to `:root`:

```css
--success: var(--green);
--surface-overlay: rgba(11, 19, 32, 0.55);
--shadow-toast: 0 12px 40px rgba(0, 0, 0, 0.15);
--shadow-modal: 0 20px 60px rgba(0, 0, 0, 0.3);
--shadow-sticky: 0 -4px 16px rgba(15, 23, 42, 0.08);
```

#### 6.1.2 `templates/index-lt.html` — CSS edits

| Selector | Change |
|----------|--------|
| `.header .header-cta .cta-button-outline` | Remove `opacity: 0.95` |
| `.hero-price-teaser` | **Add:** `font-size: var(--fs-sm); font-weight: 600; letter-spacing: 0.02em; text-transform: uppercase; opacity: 0.78; margin-top: var(--space-8);` |
| `.header-badges` | Change `justify-content: space-between` → `flex-start` (or move badge above H1 as eyebrow — markup optional) |
| `.btn:hover` | `background: var(--gradient-cta-hover)` (remove literal `#1a4d6e`) |
| `.prompt-header`, `.phase-header` | `background: var(--surface-2)` (remove `linear-gradient(to right, var(--blue-light), var(--orange-light))`) |
| `.community` | `background: var(--gradient-soft)` (remove blue/orange horizontal gradient) |
| `.form-submit` | `background: var(--accent-primary)`; hover `var(--accent-primary-hover)` |
| `.faq-summary:hover` | `background: var(--surface-2)` |
| `.toast` | border → `var(--border-subtle)`; shadow → `var(--shadow-toast)` |
| `.toast-icon`, `.form-success-icon` | `background: var(--success)` |
| `.code-block.selected` | `border-color: var(--accent-gold)` |
| `.code-block:hover` | `background: var(--surface-3)` |
| `.modal-overlay` | `background: var(--surface-overlay)` |
| `.modal` | `box-shadow: var(--shadow-modal)` |
| `.pdf-sticky-cta` | `box-shadow: var(--shadow-sticky)` |
| Focus on light UI | Replace `outline: 3px solid var(--accent-gold)` with `outline: var(--ring-focus); outline-offset: 2px` where not on navy |

#### 6.1.3 `scripts/build-locale-pages.js`

After line `html = html.replace(/\/\*[\s\S]*?\*\//g, '');` add:

```javascript
html = html.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (_, open, body, close) => {
  return open + body.replace(/\n[ \t]*\n[ \t]*\n+/g, '\n\n') + close;
});
```

#### 6.1.4 QA checklist PR-1

- [ ] `npm test` pass
- [ ] Manual: hero both CTAs readable on navy (secondary not “disabled”)
- [ ] Manual: copy prompt → toast green icon
- [ ] Manual: tab through FAQ, jump-nav, PDF preview — gold focus ring consistent
- [ ] `npm run build` → diff `en/index.html` only expected CSS/HTML whitespace

**Risk:** Low

---

### PR-2 — P1-A: Deprecated token migration (0.5–1 day)

**Branch:** `ui/ds-v02-p1-color-aliases`

Replace every occurrence in **template inline CSS**:

| From | To |
|------|-----|
| `var(--orange-light)` | `var(--surface-3)` |
| `var(--orange)` | `var(--accent-primary)` |
| `var(--blue-light)` | `var(--surface-2)` |
| `var(--community-cta-green)` | `var(--cta-primary-bg)` |
| `var(--community-cta-green-hover)` | `var(--cta-primary-bg-hover)` |

**Affected blocks (grep confirm):** `.instructions`, `.jump-nav`, `.progress-wrap`, `.code-block:hover`, `.code-block.selected`, `.community-cta-primary`, `.system-done-cta`, `.next-steps-links a:last-child:hover`.

In `assets/styles.css`, add comment block:

```css
/* v0.2: deprecated aliases — remove in v0.3 after grep clean */
```

Keep aliases for one release; do not delete until PR-3 confirms zero references in `templates/`.

**Risk:** Low (visual should be nearly identical)

---

### PR-3 — P1-B: Typography & elevation normalization (1 day)

**Branch:** `ui/ds-v02-p1-type-shadows`

#### Section headings → `--fs-2xl`

Unify: `.objectives h2`, `.workflow-overview h2`, `.faq h2`, `.community h2`, `.next-steps h2`, `.jump-nav h2`, `.instructions-title` (keep flex layout), `.pdf-guides-faq h3` → consider `var(--fs-xl)`.

#### Footer

- `.footer h3`: `font-size: var(--fs-xl)` (from 28px)
- `.footer p`: `font-size: var(--fs-md)`

#### Prompt card

- `.prompt-desc`: `font-size: var(--fs-lg)` (from 19px)

#### PDF block (rem → tokens)

Map: `0.8rem` → `--fs-xs`, `0.85rem` → `--fs-sm`, `0.95rem` → `--fs-sm`, `1rem` → `--fs-md`, `1.05rem` → `--fs-md`, `1.1rem` → `--fs-lg`, `1.15rem` → `--fs-lg`, `1.25rem` → `--fs-xl`.

#### Shadows

Replace literals on `.btn`, `.community-cta-primary`, `.pdf-guide-card--featured` with token table §4.4.

#### Breakpoints

- Move `.pdf-compare-strip` `@media (max-width: 600px)` → `768px`.

#### Line-height

Replace ad-hoc `1.45`, `1.55`, `1.65` in section intros with `var(--leading-normal)` or `var(--leading-relaxed)`.

**Risk:** Low–medium (visual diff review on mobile)

---

### PR-4 — P1-C: UX density (micro, no structure delete) (0.5 day)

**Branch:** `ui/ds-v02-p1-journey`

| Change | Implementation |
|--------|----------------|
| Buyer FAQ collapsed by default | Ensure `<details class="faq-details">` have no `open` attribute in template/SOT output |
| Merge trust micro-copy | Keep `#pdf-section-trust`; remove duplicate `.pdf-compare-note.pdf-meta-muted` under testimonial OR fold into `<cite>` |
| Single legal disclaimer in PDF block | Remove `.legal-disclaimer` inside `.pdf-guides-after-purchase` if duplicate of footer trust |
| “Common questions” before prompts | Wrap existing `.faq` (4 items) in outer `<details>` with summary “More before you start” — **optional**, needs Content 1-line summary label |

#### `generator.js` (same PR or follow-up)

On `.header-phase-link` click:

1. `document.querySelector('.phase[data-phase="' + n + '"]')` → add `.is-open` if collapsible API exists, else scroll only
2. `phaseEl.scrollIntoView({ behavior: 'smooth', block: 'start' })`
3. Update `.is-active` on chips (existing behavior — verify)

**Risk:** Medium for FAQ collapse (content still present, SEO unchanged)

---

### PR-5 — P2: CSS consolidation (2–3 days, optional sprint)

**Branch:** `ui/ds-v02-p2-extract-inline-css`

1. Move shared rules from `templates/index-lt.html` `<style>` → `assets/styles.css` under `@layer components` or prefixed `.pa-` if needed.
2. Leave page-specific: hero grain SVG, PDF grid, phase accordion.
3. Align `success.html`, `terms.html` to link `assets/styles.css` only (remove duplicate `:root` blocks).
4. Add `tests/structure.test.js` guard: `en/index.html` must not match `--orange-light:` without `DEPRECATED` comment in source template.

**Risk:** Medium (large diff, full visual regression)

---

## 7. Per-component specification (acceptance)

### 7.1 Hero `.header`

| Property | v0.1 | v0.2 |
|----------|------|------|
| Background | gradient + grain | unchanged |
| H1 | 52px / 800 | unchanged (P2 optional → `--fs-display`) |
| Subhead | 20px / opacity 0.95 | `--fs-xl` / 0.92 |
| Price teaser | unstyled | `--fs-sm` uppercase eyebrow |
| Primary CTA | white pill | unchanged |
| Secondary CTA | dimmed | full white text opacity, no extra `opacity` on container |
| Badges row | space-between, 1 child | flex-start |

### 7.2 `.btn` (prompt footer)

| Property | v0.2 |
|----------|------|
| min-height | 44px |
| padding | `var(--space-20) var(--space-32)` or match shared `assets/styles.css` |
| font-size | `var(--fs-md)` or 18px until PR-3 |
| shadow | `var(--shadow-cta)` |
| hover | `var(--gradient-cta-hover)` + `var(--shadow-cta)` |
| focus | `var(--ring-focus)` |

### 7.3 `.pdf-guide-cta`

No functional change. Verify after each PR:

- Visited state: light text on navy
- Hover: `--cta-primary-bg-hover`
- Focus: `--ring-focus`

### 7.4 `.prompt` card

| Property | v0.2 |
|----------|------|
| Header bg | `var(--surface-2)` flat |
| Border | `1px solid var(--border-subtle)` |
| Shadow rest/hover | soft / medium |
| Title | `--fs-3xl` |
| Desc | `--fs-lg` + `--text-light` |

### 7.5 Static pages (`en/privacy.html`, `success.html`, `terms.html`)

P0: no required change. P2: single `:root` from `assets/styles.css`; card radius `var(--r-card)`.

---

## 8. Module identity (subtle, v0.2 scope)

No new colors per module. Allowed:

| Module | Marker |
|--------|--------|
| Free prompts | Existing `#free-prompts-label` band |
| PDF commerce | `#pdf-guides` + gold left border on `.pdf-guides-free-bridge` (already) |
| Legal | `surface-card` + `page-shell` max-width |

Optional P2: one Lucide icon per section H2 (`target`, `file-text`, `shield`) — do not add if it increases clutter.

---

## 9. Testing & release gates

### 9.1 Automated (every PR)

```bash
npm test
```

Includes: build, structure tests, HTML validators, ESLint.

### 9.2 Manual smoke (EN)

| URL | Checks |
|-----|--------|
| `/en/` | Hero CTAs, PDF cards, first prompt copy, phase chips, sticky CTA (if visible) |
| `/en/privacy.html` | Back link, focus ring |
| `/success.html` | Buttons use navy |
| `/terms.html` | Readable hierarchy |

### 9.3 pa11y (pre-release)

```bash
npx serve . -l 3000
# Run URLs from docs/AGENT_SOT.md §6
```

### 9.4 Visual regression (recommended)

Screenshot compare at: 1440px, 768px, 375px — hero, pdf-guides, prompt #1, footer.

### 9.5 Documentation updates

| When | Update |
|------|--------|
| PR-1 merged | `CHANGELOG.md` under `### Changed` — Design system v0.2 P0 |
| All P1 merged | `docs/LEGACY_GOLDEN_STANDARD.md` — v0.2 rules list |
| Release tag | `MUST_TODO.md` — no DS item unless team adds tracking |

---

## 10. Agent workflow

| Step | Agent | Task |
|------|-------|------|
| 1 | Orchestrator | Approve PR sequence, assign PR-1 |
| 2 | UI/UX | Implement PR-1–4 per this doc |
| 3 | Content | Only if PR-4 collapses FAQ — approve summary strings |
| 4 | QA | `npm test`, pa11y, manual checklist §9.2 |
| 5 | Orchestrator | Merge order: P0 → P1-A → P1-B → P1-C → P2 optional |

**Do not** run Curriculum or prompt content changes in DS PRs.

---

## 11. Rollback

Each PR is CSS/build-only. Rollback = revert commit + `npm run build`. No data migration. If Stripe CTA colors regress, hotfix `.pdf-guide-cta:visited` first (highest revenue surface).

---

## 12. Success criteria (v0.2 complete)

- [x] Deprecated aliases: **0** usages in `templates/index-lt.html` (aliases may remain in `assets/styles.css` until v0.3)
- [x] `--ring-focus` used on ≥8 interactive components (`assets/landing.css` + `.btn`)
- [x] No `transition: all` in template CSS
- [x] Hero secondary CTA passes quick contrast check (white on navy ≥4.5:1 for text)
- [x] `npm test` green on `main`
- [ ] No new pa11y violations vs baseline (manual pre-release)
- [ ] Team sign-off: “same product, calmer UI”

---

## 17. v0.2.1 — Elevation & affordance (2026-05)

**Goal:** Fix white-on-white affordance on commerce and workflow chips without layout or DOM contract changes.

| Surface | Rule |
|---------|------|
| `.pdf-guides` | `background: var(--surface-2)` |
| `.pdf-guide-card` | `background: var(--surface-1)` + `box-shadow: var(--shadow-soft)`; hover `--shadow-medium` |
| `.pdf-guide-card--featured` | Navy border + `--shadow-medium`; hover `--shadow-elevated` |
| `.pdf-bundle-offer` | `surface-1` + `--shadow-soft` on tinted section |
| `.workflow-overview .header-phase-link` | Default `surface-2` + `border-subtle-dark`; active `surface-1` + navy border |
| PDF preview | `.btn.btn--ghost` in [`assets/styles.css`](../assets/styles.css) |

**Tests:** [`tests/structure.test.js`](../tests/structure.test.js) — `surface-2` pdf-guides, `shadow-soft` cards, chip default, `btn--ghost`.

---

## 19. v0.2.2 — Sticky & anchor polish (2026-05)

**Goal:** Fix anchor-target clipping under the sticky `#page-lanes-nav` and add premium glass affordance without DOM or layout changes.

| Surface | Rule |
|---------|------|
| Sticky-overlapped anchors (`#pdf-guides`, `#free-prompts-label`, `#workflow-overview`, `.prompt[id^="prompt"]`, `[id^="block"]`) | `scroll-margin-top: clamp(72px, 12vh, 96px)` via `:where()` (specificity 0) |
| `.page-lanes-nav` | `background: rgba(255, 255, 255, 0.85); backdrop-filter: saturate(180%) blur(12px)` |
| `.page-lanes-nav` (Firefox / older Safari fallback) | `@supports not (backdrop-filter: blur(12px))` → solid `var(--surface-1)` |
| `.pdf-sticky-cta` | `padding-bottom: max(14px, env(safe-area-inset-bottom))` (iOS home indicator) |
| `.skip-link:focus` | `outline: var(--ring-focus)` (token, replaces literal `3px solid var(--text)`) |

**Tests:** [`tests/structure.test.js`](../tests/structure.test.js) — `scroll-margin-top` clamp, `backdrop-filter` + `@supports` fallback, `env(safe-area-inset-bottom)`, `.skip-link:focus` token.

---

## 19a. v0.2.3 — Motion ritmu & lift token sistema (2026-05)

**Goal:** One motion ritmu across the page; codified hover lift scale; reduced-motion that actually neutralizes transforms.

### Tokens added (assets/styles.css `:root`)

| Token | Value | Use |
|-------|-------|-----|
| `--lift-sm` | `-1px` | Hero CTA, dense / secondary surfaces, sticky CTA |
| `--lift-md` | `-2px` | Primary CTA (`.btn`, `.pdf-guide-cta`) |

### Rules

- **Transitions:** Replace literal `\d+(\.\d+)?s ease` with `var(--duration-fast|normal|slow) var(--ease-out)` across `landing.css`. Existing `--duration-fast: 150ms`, `--duration-normal: 250ms`, `--duration-slow: 400ms`.
- **Lift:** Primary action = `translateY(var(--lift-md))`; hero / secondary / dense / sticky = `translateY(var(--lift-sm))`; ghost / info = no lift.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` block adds `*::before, *::after` coverage, `animation-iteration-count: 1`, `scroll-behavior: auto !important`, and explicit `*:hover, *:focus-visible { transform: none !important; }` (vestibular safety per WCAG 2.3.3).

**Affected selectors (lift):** `.btn`, `.pdf-guide-cta` (md); `.cta-button` (hero override + base), `.cta-button-outline`, `.form-submit`, `.phase-header`, `.community-cta-primary`, `.pdf-sticky-cta-btn` (sm).

**Tests:** [`tests/structure.test.js`](../tests/structure.test.js) — no literal `Ns ease` transitions, `--lift-sm` ≥4×, `--lift-md` ≥2×, tokens declared in `styles.css`, reduced-motion `transform: none !important`.

---

## 19b. v0.2.4 — Focus + radius + form consolidation (2026-05)

**Goal:** Zero literal `outline:` and `border-radius:` declarations in `landing.css`; form input focus speaks the same brand language as the rest of the UI.

### Tokens added (assets/styles.css `:root`)

| Token | Value | Use |
|-------|-------|-----|
| `--ring-focus-on-dark` | `3px solid #FFFFFF` | Hero / navy nav focus rings (light surfaces continue with `--ring-focus`) |
| `--r-xs` | `4px` | Progress bar, preview thumb, focus-ring border-radius on inline links |

### Rules

| Surface | Token |
|---------|-------|
| `.skip-link:focus`, `.modal-close:focus-visible`, `.header-badges a.badge`, `.footer-product-link a` | `--ring-focus` |
| `.header-phase-link`, hero `.cta-button*`, `.hero-lane-hint a` | `--ring-focus-on-dark` |
| `.form-input:focus-visible` | `border-color: var(--accent-gold-dark); box-shadow: 0 0 0 4px rgba(207, 167, 58, 0.25)` (gold ring matches rest of UI) |
| `.code-block` border-left | 3px (matches `.faq-panel` gravitas) |
| Pill-shaped chips (`.header-phase-link`, `::before`, `.phase-chevron`) | `var(--r-pill)` |
| 8px radius surfaces (instructions code, prompt-time, pdf cover, testimonial) | `var(--r-sm)` |
| 4px radius (progress bar, preview thumb, focus border-radius) | `var(--r-xs)` |
| Dialog modal | `var(--r-md)` |

**Tests:** [`tests/structure.test.js`](../tests/structure.test.js) — token declarations, no literal outline / border-radius (999/8/4/12 px), gold form ring, code-block 3px border-left.

---

## 20. v0.2.5 — Affordance & state polish (2026-05)

**Goal:** Add CSS-only state feedback that vartotojui matomas po kliko / po kopijavimo / po featured-card rinkimosi — be naujo teksto, be DOM lūžių, be JS.

### Rules

| Surface | Rule |
|---------|------|
| `.prompt:hover` | Add `transform: translateY(var(--lift-sm))` (matches CTA hover physics) |
| `.prompt:has(.prompt-done:checked)` | `opacity: 0.85; border-left: 3px solid var(--accent-gold)` — gated by `@supports selector(:has(*))` so Safari < 15.4 fallback'as is the native checkbox tick |
| `.code-block.selected::after` | Small gold check marker (top-right, 8×8px, rotated borders, `opacity: 0.7`) — color-blind safe affordance beyond the gold border |
| `.code-block` overflow | `scrollbar-width: thin; scrollbar-color: var(--border-subtle-dark) transparent` + WebKit thumb 6px |
| `.pdf-guide-card--featured` | Add `inset 0 0 0 1px var(--accent-gold)` to existing `--shadow-medium` — premium "Recommended" affordance |
| `.business-address` | Desktop `max-width: 320px → 420px` (less orphaned on wide footer) |

### Hygiene

- **`.btn` deduplication.** Baseline declared in [`assets/styles.css`](../assets/styles.css). [`assets/landing.css`](../assets/landing.css) keeps only `.prompt-footer .btn` scoped override (`padding`, `font-size`, `font-family`) and `.btn.success` state. Mobile breakpoint scoped to `.prompt-footer .btn`.
- **`*` reset deduplication.** [`assets/landing.css`](../assets/landing.css) `*` no longer redeclares `box-sizing` (inherited from [`assets/styles.css`](../assets/styles.css) `*`). Landing only neutralizes `margin: 0; padding: 0`.

### Browser support

- `:has()` — Safari ≥15.4, Chrome ≥105, Firefox ≥121. Older browsers fall back to native checkbox tick (no regression, just no card-level dim/gold border).
- `@supports selector(:has(*))` — universally supported as a feature query syntax even where `:has()` itself isn't.

**Tests:** [`tests/structure.test.js`](../tests/structure.test.js) — `:has()` gated by `@supports`, selected `::after` rotate(45deg), `.prompt:hover` lift-sm, featured gold inset, scrollbar styling, business-address 420px, no top-level `.btn { }` in landing.css, `.prompt-footer .btn` scope.

---

## 21. v0.3.0 — Token harmonization & premium polish (2026-05)

**Goal:** Lift perceived quality to premium SaaS tier without any layout, redesign, copy, DOM, or JS changes. Pure token completion + micro-polish on shadows, gradients, borders, button physics, and global typography. Four small reviewable PRs.

### 21.1 PR-1 — Shadow & inset system

**Tokens added** (`assets/styles.css :root`):

| Token | Value | Use |
|-------|-------|-----|
| `--shadow-inset-hi` | `inset 0 1px 0 rgba(255, 255, 255, 0.6)` | Canonical inset highlight on every elevated surface |
| `--shadow-inset-hi-strong` | `inset 0 1px 0 rgba(255, 255, 255, 0.95)` | Hero CTA only — premium glass tell |
| `--shadow-cta-press` | `0 1px 2px rgba(11, 19, 32, 0.18), inset 0 1px 2px rgba(0, 0, 0, 0.08)` | `:active` sunken press feedback |
| `--shadow-glow-success` | `0 4px 12px rgba(16, 59, 90, 0.3), 0 0 0 2px var(--accent-primary)` | `.btn.success` copy-state glow |
| `--shadow-glow-gold` | `0 2px 6px rgba(207, 167, 58, 0.35), 0 1px 0 rgba(255, 255, 255, 0.3) inset` | Objectives gold checkmark sphere |
| `--shadow-glow-gold-hover` | `0 4px 10px rgba(207, 167, 58, 0.4)` | Same on hover (1.05× scale) |

**Rules**

- **Inset highlight is the only inset-highlight token** going forward. 11 literal `inset 0 1px 0 rgba(255, 255, 255, 0.x)` sites collapse to two tokens.
- **Hover ladder** (rest != hover):
  - Rest = `--shadow-soft` (or `--shadow-cta` for CTAs)
  - Hover = `--shadow-medium, --shadow-cta` (CTAs lift visually, not just translate)
  - Press = `--shadow-cta-press` (applied via `:active`)
- **Press feedback** added to 5 buttons that previously had none or only `translateY(0)`: `.cta-button`, `.community-cta-primary`, `.form-submit`, `.next-steps-links a`, `.pdf-sticky-cta-btn`. Pattern: `transform: translateY(0) scale(0.98); box-shadow: var(--shadow-cta-press)`.
- The `.code-block` left-edge multi-shadow stack is the documented page-specific exception (kept as-is).

**Affected selectors:** `.btn` (rest+hover+active), `.cta-button` (hero rest+hover+active), `.pdf-guide-cta` (rest+hover+active), `.community-cta-primary` (hover+active), `.pdf-sticky-cta-btn` (hover+active), `.form-submit` (hover+active), `.next-steps-links a` (active), `.btn.success`, `.objectives li::before`/`:hover`, `.prompt`/`:hover`, `.phase`, `.instructions`, `.objectives`, `.workflow-overview`, `.free-tier-band`, `.header-phase-link.is-active`.

### 21.2 PR-2 — Typography polish

**Globals on `body`** (`assets/landing.css`):

```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
text-rendering: optimizeLegibility;
```

**Globals on `:root`** (`assets/styles.css`):

```css
color-scheme: light;
accent-color: var(--accent-primary);
```

`accent-color` natively brand-colors all checkbox/radio/range/progress controls — the local declaration on `.prompt-done-wrap input` is no longer necessary (kept for safety; it inherits the same value).

**Tabular-nums applied to 5 numeric components:** `.pdf-guide-price-new`, `.progress-wrap p`, `.prompt-time`, `.phase-meta`, `.phase-badge`. Prices align across PDF cards; progress digits don't shift width.

**Hero H1 fluid type:**

```css
.header h1 { font-size: clamp(28px, 6vw + 8px, 52px); }
```

Collapses 4 media-query overrides (1024 / 768 / 480 / 375) into a single rule. The `375px` rule keeps `line-height: 1.2` only.

### 21.3 PR-3 — Color & gradient tokens

**Gradient tokens** (`assets/styles.css :root`):

| Token | Use |
|-------|-----|
| `--gradient-hero` | `.header` (radial light + linear navy) |
| `--gradient-card-tint` | `.instructions` (surface-3 → surface-2) |
| `--gradient-jump-nav` | `.jump-nav` (surface-2 → white) |
| `--gradient-gold-pearl` | `.objectives li::before` (gold sphere) |

Code-block left-edge accent gradient is the documented page-specific exception.

**Border tokens** (replace 5+ literal `rgba(16, 59, 90, X)`):

| Token | Value |
|-------|-------|
| `--border-navy-soft` | `rgba(16, 59, 90, 0.14)` |
| `--border-navy` | `rgba(16, 59, 90, 0.25)` |
| `--border-navy-strong` | `rgba(16, 59, 90, 0.35)` |

Migrated: `.instructions`, `.instructions-subcard`, `.instructions code`, `.instructions-title .prompt-time`, `.jump-nav a`, `.code-block:hover`, `.progress-wrap`.

**Glass parity:** `.pdf-sticky-cta` gets the same `backdrop-filter: saturate(180%) blur(12px)` + `@supports not` solid fallback as `.page-lanes-nav` (DS v0.2.2). Bottom sticky now matches top sticky.

**Fix:** removed `opacity: 0.95` leftover from hero `.cta-button-outline` (DS v0.2 §6.1.2 P0 item that slipped through).

### 21.4 PR-4 — Deprecation warnings (aliases stay one more release)

Per release decision: **aliases kept declared in `assets/styles.css` for v0.3.0 back-compat**, with a consolidated `DEPRECATED — REMOVED IN v0.3.1` block. Structural test guard blocks any **new** usage in [`templates/index-lt.html`](../templates/index-lt.html) and [`assets/landing.css`](../assets/landing.css).

Existing `var(--shadow-card)` and `var(--shadow-card-hover)` consumers in `landing.css` (13 sites) were migrated to the canonical `--shadow-soft` / `--shadow-medium` since those are 1:1 aliases (value-preserving).

**Hard removal (with grep clean) is the v0.3.1 release goal.**

**Tests:** [`tests/structure.test.js`](../tests/structure.test.js) — 30+ new asserts across PR-1 through PR-4 (token declarations, hover ladder shape, press states, glass fallback, deprecation guard).

---

## 18. v0.3 backlog → shipped + v0.3.1 backlog

**Shipped in v0.3.0:**
- Token harmonization (shadow inset system, gradient tokens, navy border ladder).
- Premium SaaS typography globals (font smoothing, optimizeLegibility, tabular-nums, fluid hero H1).
- Hover ladders rise (rest != hover); `:active` press feedback on every primary button.
- Glass treatment on `.pdf-sticky-cta` (parity with `.page-lanes-nav`).
- Hero secondary CTA `opacity: 0.95` leftover removed.

**v0.3.1 backlog:**
- Hard removal of 7 deprecated `:root` aliases (`--orange-light`, `--orange`, `--blue-light`, `--community-cta-green*`, `--shadow-card*`); the v0.3.0 PR-4 guard already enforces zero new usage.
- PR-5 — CTA size-token harmonization (`--btn-pad-sm/md/lg/xl`, `--btn-min-h-sm/md/lg`) applied to existing 7 selectors (no new class names per AGENTS.md §10). Requires screenshot baseline first.
- Line-height token consolidation (7 ad-hoc literals → 3 `--leading-*` tokens).
- Deduplicate `:root` on `success.html` / `terms.html` → link shared `assets/styles.css` only.
- Optional Playwright or manual screenshot baseline (1440 / 768 / 375) per §9.4.

---

## 13. Appendix A — Grep commands (pre/post)

```bash
# Deprecated tokens in source template
rg "orange-light|community-cta-green|blue-light" templates/index-lt.html

# Raw font sizes (track reduction)
rg "font-size:\s*\d+px" templates/index-lt.html | wc -l

# Focus ring drift
rg "outline:.*solid" templates/index-lt.html

# transition all
rg "transition:\s*all" templates/index-lt.html

# Public brand leaks
rg -i "personalas|series no" en/ templates/
```

---

## 14. Appendix B — Token add/remove log

| Token | Action | PR |
|-------|--------|-----|
| `--success` | Add (alias `--green`) | PR-1 |
| `--surface-overlay` | Add | PR-1 |
| `--shadow-toast` | Add | PR-1 |
| `--shadow-modal` | Add | PR-1 |
| `--shadow-sticky` | Add | PR-1 |
| `--orange-light` | Deprecate → remove refs | PR-2, delete alias v0.3 |
| `--fs-*` | Adopt widely | PR-3 |
| `--lift-sm` | Add (-1px) | v0.2.3 |
| `--lift-md` | Add (-2px) | v0.2.3 |
| `--ring-focus-on-dark` | Add (3px white) | v0.2.4 |
| `--r-xs` | Add (4px) | v0.2.4 |
| `--shadow-inset-hi` | Add (canonical inset highlight) | v0.3.0 PR-1 |
| `--shadow-inset-hi-strong` | Add (hero CTA inset) | v0.3.0 PR-1 |
| `--shadow-cta-press` | Add (`:active` sunken state) | v0.3.0 PR-1 |
| `--shadow-glow-success` | Add (.btn.success copy-state) | v0.3.0 PR-1 |
| `--shadow-glow-gold` / `-hover` | Add (objectives checkmark) | v0.3.0 PR-1 |
| `--gradient-hero` | Add (radial light + linear navy) | v0.3.0 PR-3 |
| `--gradient-card-tint` | Add (surface-3 → surface-2) | v0.3.0 PR-3 |
| `--gradient-jump-nav` | Add (surface-2 → white) | v0.3.0 PR-3 |
| `--gradient-gold-pearl` | Add (gold sphere) | v0.3.0 PR-3 |
| `--border-navy-soft` / `--border-navy` / `--border-navy-strong` | Add (replaces 5+ rgba(16, 59, 90, X) literals) | v0.3.0 PR-3 |
| `color-scheme` / `accent-color` (root globals) | Add | v0.3.0 PR-2 |
| `--orange*`, `--blue-light`, `--community-cta-green*`, `--shadow-card*` | Mark consolidated DEPRECATED block; new usage blocked by structural test | v0.3.0 PR-4 (delete in v0.3.1) |

---

## 15. Appendix C — Effort estimate

| PR | Dev (h) | QA (h) | Total |
|----|---------|--------|-------|
| PR-1 P0 | 3–4 | 1 | 4–5 |
| PR-2 P1-A | 2 | 1 | 3 |
| PR-3 P1-B | 4–6 | 2 | 6–8 |
| PR-4 P1-C | 2–3 | 1 | 3–4 |
| PR-5 P2 | 12–16 | 4 | 16–20 |
| **Total (without P2)** | **11–15** | **5** | **16–20 h** |

---

## 16. Revision history

| Date | Version | Notes |
|------|---------|-------|
| 2026-05-19 | 0.2.0-plan | Initial implementation plan from v0.1 audit |
| 2026-05-20 | 0.2.1 | Elevation & affordance (PDF surface-2, card shadows, workflow chips, btn--ghost) |
| 2026-05-20 | 0.2.2 | Sticky & anchor polish (scroll-margin clearance, glass nav, safe-area, skip-link token) |
| 2026-05-20 | 0.2.3 | Motion ritmu & lift token sistema (--lift-sm/-md, transition tokens, reduced-motion transform reset) |
| 2026-05-20 | 0.2.4 | Focus + radius + form consolidation (--ring-focus-on-dark, --r-xs, gold form ring, code-block 3px) |
| 2026-05-20 | 0.2.5 | Affordance & state polish (:has done state, selected check marker, prompt hover lift, featured gold inset, scrollbar styling, .btn deduplication) |
| 2026-05-20 | 0.3.0 | Token harmonization & premium polish (shadow inset system, gradient + navy border tokens, hover ladders rise, :active press on every primary, font smoothing + tabular-nums + fluid hero H1, .pdf-sticky-cta glass parity, deprecation guard for v0.3.1 hard removal) |

---

*This plan does not replace [LEGACY_GOLDEN_STANDARD.md](LEGACY_GOLDEN_STANDARD.md) for prompt DOM rules; it extends it for visual tokens and CSS hygiene.*
