# USA Localization Implementation Report

## Scope

This repository now treats the generated English experience as a US domestic (`en-US`) hiring workflow while preserving the Lithuanian source and generated Lithuanian pages.

## Architecture changes

- **Locale model:** the generated English page uses `lang="en-US"` and `hreflang="en-US"` while keeping the existing `/en/` route for URL compatibility.
- **Source of truth:** US English content is still generated through `scripts/build-locale-pages.js`; generated files under `en/` should not be edited by hand.
- **Runtime behavior:** `generator.js` normalizes any English-like `<html lang>` value to `en-US`, so dynamic labels and language-switcher state stay consistent.
- **Regression coverage:** structure tests now verify US locale metadata, US currency examples, US city/state examples, US date guidance, US phone guidance, Zip Code terminology, and absence of common non-US locale fragments.

## UX and localization standards

### Language and tone

- Tone is professional, direct, and US HR/SaaS-oriented.
- Generic “recruitment” wording has been shifted toward “hiring” where it reads more naturally for a US audience.
- Phase labels were adapted from literal translations to action-oriented US workflow labels:
  - Diagnose
  - Define the Role
  - Source Candidates
  - Screen & Interview
  - Close the Offer
  - Onboard & Retain

### Date and time

- User-facing guidance now specifies **MM/DD/YYYY** for US dates.
- No 24-hour time examples are introduced.
- If future time fields are added, use 12-hour time with AM/PM unless a technical context requires otherwise.

### Financial and numeric formatting

- Compensation examples use the dollar sign, comma thousands separators, and periods for decimals.
- Examples include:
  - `$85,000–$105,000`
  - `$1,250.50`

### Phone numbers

- Phone guidance uses the US-friendly international format: `+1 (415) 555-0198`.
- Prompt placeholders explicitly show `Contact phone: [optional, e.g., +1 (415) 555-0198]`.
- Future validators should accept `+1 (XXX) XXX-XXXX` as the canonical display format.

### Address structure

- Address terminology uses US conventions and prompt guidance now follows this field order:
  - Street Address
  - City
  - State
  - Zip Code
- Prompt guidance includes US city/state examples such as `New York, NY`, `San Francisco, CA`, `Austin, TX`, `Chicago, IL`, and `Seattle, WA`.
- Role-location placeholders support `Remote – US`, hybrid, and on-site examples, with optional Zip Code examples such as `San Francisco, CA 94105`, `Chicago, IL 60601`, and `Seattle, WA 98101`.

## Implementation notes

The current application does not include active address or phone forms. Therefore, this pass localizes prompt guidance and regression tests for Street Address, City, State, Zip Code, and +1 phone formatting rather than adding unused validators. If forms are added later, add dedicated utilities for US Zip Code, State, phone, date, and USD formatting.
