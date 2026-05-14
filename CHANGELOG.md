# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Added this changelog to track repository-level release notes.
- Added a USA localization implementation report that documents the `en-US` architecture, UX standards, and future validator guidance.

### Changed
- Implemented Phase 5 contact-format guidance for Street Address, City, State, Zip Code, and `+1 (XXX) XXX-XXXX` phone placeholders without adding unused form validators.
- Implemented Phase 4 geographic localization with role-location placeholders, multiple US city/state examples, optional Zip Code examples, and `Remote – US` guidance.
- Localized the generated English experience for US HR teams using `lang="en-US"` and `hreflang="en-US"` while preserving the existing `/en/` route.
- Updated English hiring workflow copy, phase labels, prompt examples, and privacy copy for a professional US audience.
- Added US-format examples for locations, addresses, dates, phone numbers, and compensation, including `New York, NY`, `San Francisco, CA`, `Zip Code`, `MM/DD/YYYY`, `+1 (415) 555-0198`, `$85,000–$105,000`, and `$1,250.50`.
- Updated runtime locale handling so English-like page language values normalize to `en-US`.
- Updated README and package metadata to describe the US-localized HR hiring prompt library.

### Tests
- Added Phase 5 contact-format regression checks for Street Address, two-letter State, Zip Code, and canonical US phone placeholders.
- Added Phase 4 geographic regression checks for multiple US cities, role-location placeholders, remote/hybrid/on-site examples, and optional Zip Code examples.
- Extended structure tests to verify US locale metadata, US city/state examples, US dollar formatting, US date guidance, US phone guidance, Zip Code terminology, and absence of obvious non-US or Lithuanian fragments in generated English UI.
