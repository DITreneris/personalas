# TODO – H0 (see)

Horizon checklist for bet **B** ([ROADMAP.md](ROADMAP.md)). Do not expand into H1 work until H0 gates are checked.

## Attribution

- [x] Entity footer already has `utm_source=help` / `utm_medium=entity_footer`
- [x] Hero badge → `.app` with `utm_medium=badge` + analytics hook
- [x] Community illustration → `utm_medium=community_illustration`
- [x] Community CTA → `utm_medium=community`
- [x] Footer contact → `utm_medium=footer_contact`
- [x] Structure tests assert every `.app` href on `/en/` carries `utm_source=help`
- [ ] Production deploy smoked: community CTA URL bar shows `utm_source=help`

## GitHub / harvest surface

- [x] README first screen: who, outcome, 10-minute proof, UTM CTAs
- [x] Blog link: [Hiring Prompts Without the Data Leak](https://www.promptanatomy.blog/articles/hiring-prompts-help-launch/?utm_source=github&utm_medium=readme&utm_campaign=hire)
- [ ] GitHub Settings → About: Homepage `https://www.promptanatomy.help/en/`; topics `hr`, `recruiting`, `prompts`, `chatgpt`, `hiring`

## Measure (weekly)

- [ ] Plausible: `/en/` visitors, prompt copy / PDF CTA events
- [ ] PostHog (`.app` only): `InitialUTMSource=help` > 0 after UTM ship
- [ ] Do **not** install PostHog on `.help` until privacy rewrite

## Explicit non-goals (H0)

- [ ] ~~New blog article~~ — use existing deepen piece
- [ ] ~~Third PDF / ATS / LT public UI / contact form / fake reviews~~

**Kill check (day ~14):** if Plausible shows no copy/PDF intent **and** hub still has `help=0` → reopen bet (A store vs E gift prompts). See [ROADMAP.md](ROADMAP.md).
