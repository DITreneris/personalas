# Design System v2.0 — Reference

**Status:** Release (2026-05)  
**Audience:** UI/UX, Frontend, Content, QA  
**Historical plan:** [archive/design_systemv02.md](archive/design_systemv02.md) (v0.2–v0.3 PR log)  
**Golden standard:** [LEGACY_GOLDEN_STANDARD.md](LEGACY_GOLDEN_STANDARD.md)

---

## 1. Version map

| Version | Scope |
|---------|--------|
| v0.2–v0.3 | Token migration, landing.css extraction, shadow/focus/motion polish |
| v1 tokens | Semantic surfaces, `--fs-*`, `--ring-focus`, type scale in `assets/styles.css` |
| **v2.0** | Deprecated alias removal, CTA size tokens, line-height consolidation, satellite page parity, release docs |

**Edit paths:** `templates/index-lt.html` → `npm run build` → `en/`; CSS in `assets/styles.css` + `assets/landing.css`; copy in `config/sot.json`.

---

## 2. CTA hierarchy (no new class names)

| Class | Use |
|-------|-----|
| `.header .header-cta .cta-button` | Hero primary (white pill) |
| `.header .header-cta .cta-button-outline` | Hero secondary (glass) |
| `.pdf-guide-cta` | Stripe buy on PDF cards + bundle |
| `.btn` | Copy prompt, generic primary |
| `.btn.btn--ghost` | PDF preview close, secondary on light |
| `.community-cta-primary` | Mother-brand course link |
| `.pdf-sticky-cta-btn` | Bottom sticky commerce |
| `.form-submit` | Modal submit |

**Size tokens** (`assets/styles.css`):

| Token | Value | Typical use |
|-------|-------|-------------|
| `--btn-pad-sm` | 12px 18px | `.btn`, `.pdf-guide-cta`, sticky |
| `--btn-pad-md` | 14px 28px | Baseline `.cta-button`, mobile hero |
| `--btn-pad-lg` | 20px 32px | `.community-cta-primary` |
| `--btn-pad-xl` | 28px 48px | Hero primary desktop |
| `--btn-min-h-sm` | **48px** | Default touch target (Lighthouse / Material; clears Apple 44pt) |
| `--btn-min-h-md` | 48px | Mobile hero CTAs |
| `--btn-min-h-lg` | 56px | Hero primary desktop |

---

## 3. Elevation ladder

| State | Shadow |
|-------|--------|
| Rest (cards) | `--shadow-soft` |
| Rest (primary CTA) | `--shadow-cta` |
| Hover | `--shadow-medium` (+ `--shadow-cta` for buttons) |
| Active / press | `--shadow-cta-press` |
| Modal | `--shadow-modal` |
| Inset highlight | `--shadow-inset-hi` / `--shadow-inset-hi-strong` (hero only) |

---

## 4. Focus rings

| Surface | Token |
|---------|--------|
| Light UI | `--ring-focus` (3px gold) |
| Navy hero / dark nav | `--ring-focus-on-dark` (3px white) |

---

## 5. Typography

**Scale:** `--fs-xs` (12) … `--fs-display` (48); hero H1 uses `clamp(28px, 6vw + 8px, 52px)`.

**Line height:**

| Token | Value | Use |
|-------|-------|-----|
| `--leading-tight` | 1.25 | Headings, compact UI |
| `--leading-normal` | 1.5 | Body, FAQ |
| `--leading-relaxed` | 1.6 | Ledes, instructions, errors |

**Reading width:** `.pdf-guides-lede`, `.workflow-overview-lede` → `max-width: 65ch`.

---

## 6. Breakpoints

| Width | Behavior |
|-------|----------|
| ≤1024px | Container padding tightens |
| ≤768px | `#page-lanes-nav` hidden; hero CTAs switch lanes; reduced scroll-margin |
| ≤480px | Full-width hero CTAs (max 280px); stacked header-cta |
| ≤375px | Minimum container padding |

---

## 7. Satellite pages

Post-checkout and legal pages use:

- `assets/styles.css` (tokens + `.btn`)
- `assets/satellite.css` (`.satellite-card`, `.satellite-meta`, …)

Pages: `success.html`, `terms.html`. Do not redefine `.btn` inline.

---

## 8. Content tone

US English, practical, premium SaaS — see [language-guidelines-en-lt.md](language-guidelines-en-lt.md). Public brand: **Prompt Anatomy** only on shipped HTML.

---

## 9. Non-goals (v2.0)

- No new CTA class names after v0.2
- No reintroduction of `.pdf-expert-card` / `.pdf-proof-inside` (Phase D)
- No hero layout redesign
- No prompt body rewrites in `<pre>` without Content PR

---

## 10. Release checklist

### Visual QA

- [x] Typography uses `--fs-*` and `--leading-*`
- [x] Commerce CTAs ≥48px touch targets (`--btn-min-h-sm`)
- [x] PDF featured card gold inset visible
- [x] Preview dialog footer uses `.btn.btn--ghost`

### UX QA

- [x] Hero → PDF → See inside → preview → close (structure + production visual checks)
- [x] Bundle unhides after Stripe init
- [x] Copy prompt + toast + mark-as-done (delegated listeners in generator.js)
- [x] Sticky CTA visible → toast/footer cleared (`body.has-pdf-sticky-cta` / `--pdf-sticky-offset`)

### Content QA

- [x] Buy CTAs: `Buy/Get [product] — $X.XX`
- [x] Trust line matches terms refund copy
- [x] Stripe Dashboard page counts match SOT (API verified 2026-07-29)

### Accessibility QA

- [x] pa11y pass on CI URLs
- [x] Focus visible on all interactives
- [x] `--text-muted` AA on `--surface-2`

### Documentation QA

- [x] This file + CHANGELOG DS v2.0 under [1.3.0] (product SemVer stays 1.x)
- [x] MUST_TODO DS items checked

---

## 11. Visual regression

Baselines are **not** committed (gitignore). Regenerate locally:

See [qa/screenshots/v2.0-baseline/README.md](qa/screenshots/v2.0-baseline/README.md) — `scripts/capture-ds-baseline.js`.

---

**Last updated:** 2026-07-29
