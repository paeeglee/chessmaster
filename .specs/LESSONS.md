# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

### L-010 - Click every user action the spec names through the wired app, not only in the presentational component
- signal: `surviving_mutant` · recurrence: 2 feature(s) · scope: `web-tests` · harmful: 0
- features: evaluation-engine, game-input-screen
- evidence: M17 / apps/web/src/app/EngineIndicator.tsx:19 (EVAL-09) (web-tests) (+1 more)
- last seen: 2026-11-23T14:21:46Z

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

### L-006 - For text parsers, specify what happens to unrecognized tokens between valid tokens, not only before and after them
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `parser` · harmful: 0
- features: game-parser-rules
- evidence: validation.md gap 1 / GAME-08 (apps/web/src/domains/game/model/moveText.ts:92-93) (parser)
- last seen: 2026-11-23T13:43:42Z

### L-007 - Give every alternative in a compound condition its own test case, not just the first alternative
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `parser` · harmful: 0
- features: game-parser-rules
- evidence: validation.md M22 (apps/web/src/domains/game/model/moveText.ts:120) (parser)
- last seen: 2026-11-23T13:46:41Z

### L-008 - Assert the value an adapter forwards into machine context, not only the end state the actor reaches
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `web-machines` · harmful: 0
- features: evaluation-engine
- evidence: M12 / apps/web/src/domains/evaluation/machines/engineLoaderMachine.ts:46 (EVAL-06) (web-machines)
- last seen: 2026-11-23T13:54:31Z

### L-009 - When the spec names a timeout value, test the default with fake timers instead of only an injected short timeout
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `web-tests` · harmful: 0
- features: evaluation-engine
- evidence: M16 / apps/web/src/domains/evaluation/engine/EngineClient.ts:26 (EVAL-08) (web-tests)
- last seen: 2026-11-23T13:54:31Z

### L-011 - When state must survive a round trip, assert every field of it after the return, not a subset
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `web-machines` · harmful: 0
- features: game-input-screen
- evidence: M19 / apps/web/src/domains/game-input/machines/gameInputMachine.ts:27 (IN-23) (web-machines)
- last seen: 2026-11-23T14:21:46Z

### L-012 - For a formula the spec defines, pick test inputs where dropping any single term changes the expected output
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `web-tests` · harmful: 0
- features: game-input-screen
- evidence: M20 / apps/web/src/domains/game-input/model/estimate.ts:10 (IN-24) (web-tests)
- last seen: 2026-11-23T14:21:46Z

### L-013 - Test every numeric threshold at exactly its boundary value and one step below it
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `domain-model` · harmful: 0
- features: analysis-model
- evidence: M1/M23 apps/web/src/domains/analysis/model/classify.ts:17,73 (AN-03) (domain-model)
- last seen: 2026-11-23T17:00:09Z

### L-014 - For each conjunct or guard in a rule build a fixture where only that condition decides the outcome
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `domain-model` · harmful: 0
- features: analysis-model
- evidence: M2/M3/M21 apps/web/src/domains/analysis/model/classify.ts:43,73 (AN-03, AN-06, AN-08) (domain-model)
- last seen: 2026-11-23T17:00:09Z

### L-015 - Feed selection functions mixed inputs that include items they must exclude
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `domain-model` · harmful: 0
- features: analysis-model
- evidence: M11 apps/web/src/domains/analysis/model/keyMoments.ts:25 (AN-17) (domain-model)
- last seen: 2026-11-23T17:00:09Z

### L-016 - Reconcile each spec rule with the glossary definition and the spec's own assumptions table before tasks
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: analysis-model
- evidence: AN-09 vs docs/product/glossary.md; AN-15 vs spec Assumptions table (spec)
- last seen: 2026-11-23T17:00:09Z

### L-017 - Apply domain coverage thresholds per domain folder, not to one glob that averages all domains
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `tooling` · harmful: 0
- features: analysis-model
- evidence: apps/web/vite.config.ts:43-48 analysis/model branches 88.57% (tooling)
- last seen: 2026-11-23T17:00:09Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
