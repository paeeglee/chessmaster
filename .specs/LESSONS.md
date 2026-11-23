# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Make the lint gate fail on warnings so rules the project forbids, such as explicit any, cannot pass make check
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `tooling` · harmful: 0
- features: scaffold
- evidence: SCAF-16 / sensor T1 / apps/web/package.json:14 (tooling)
- last seen: 2026-11-23T13:38:51Z

### L-002 - Cover every server mode the spec names with an automated test instead of a manual check
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `web-config` · harmful: 0
- features: scaffold
- evidence: M11 / apps/web/vite.config.ts:18 (SCAF-01) (web-config)
- last seen: 2026-11-23T13:38:51Z

### L-003 - To prove a component makes no network call, record MSW request events and assert none after awaiting a tick
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `web-tests` · harmful: 0
- features: scaffold
- evidence: M10 / apps/web/src/app/App.test.tsx:27-32 (SCAF-26) (web-tests)
- last seen: 2026-11-23T13:38:51Z

### L-004 - Name exactly which targets need per-app variants instead of saying every aggregate target
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `makefile` · harmful: 0
- features: scaffold
- evidence: SCAF-24 / Makefile:99-110 (makefile)
- last seen: 2026-11-23T13:38:51Z

### L-005 - State which literal kinds the no-literal-tokens rule covers and test each kind, not only colors
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `web-theme` · harmful: 0
- features: scaffold
- evidence: SCAF-06 / apps/web/src/app/App.test.tsx:41 (web-theme)
- last seen: 2026-11-23T13:38:51Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
