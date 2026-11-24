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

### L-018 - Verify each hand-made chess test position with the rules engine before relying on what it claims
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `domain-model` · harmful: 0
- features: analysis-model
- evidence: M21 round 2 apps/web/src/domains/analysis/model/classify.test.ts:294-310 (AN-08) (domain-model)
- last seen: 2026-11-23T17:04:33Z

### L-019 - Do not let a test pass only because of a library's result ordering; also cover the order-reversed case
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `domain-model` · harmful: 0
- features: analysis-model
- evidence: M21b round 3 apps/web/src/domains/analysis/model/classify.ts:43 (AN-08) (domain-model)
- last seen: 2026-11-23T17:06:43Z

### L-020 - Test text verification against every notation family the product accepts, including English piece letters, pawn captures, castling and ellipsis move labels
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `api-verification` · harmful: 0
- features: explanation-api
- evidence: EXP-05/EXP-06 apps/api/src/game_analyzer/domains/explanation/domain/verification.py:14-16 (api-verification) (api-verification)
- last seen: 2026-11-23T17:09:52Z

### L-021 - Test text verification with moves cited without a move number but with a leading ellipsis, as Black moves are usually written
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `api-verification` · harmful: 0
- features: explanation-api
- evidence: EXP-05 round 2 apps/api/src/game_analyzer/domains/explanation/domain/verification.py:21 (api-verification) (api-verification)
- last seen: 2026-11-23T17:09:52Z

### L-022 - Verify every list in an AI response against its contract counterpart, not only the first one the spec names
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `api-verification` · harmful: 0
- features: explanation-api
- evidence: EXP-01 apps/api/src/game_analyzer/domains/explanation/domain/verification.py:89-91 (api-verification) (api-verification)
- last seen: 2026-11-23T17:09:52Z

### L-023 - State in the spec whether decimal numbers are allowed in AI text and test that invented evaluations are rejected
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `api-verification` · harmful: 0
- features: explanation-api
- evidence: EXP-07 apps/api/src/game_analyzer/domains/explanation/domain/verification.py:17 (api-verification) (api-verification)
- last seen: 2026-11-23T17:09:52Z

### L-024 - Give every failure or tone requirement an observable outcome such as an HTTP status or exact text
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `spec` · harmful: 0
- features: explanation-api
- evidence: EXP-12 apps/api/src/game_analyzer/domains/explanation/api/router.py:28-29; EXP-15 fake_provider.py:75 (spec) (spec)
- last seen: 2026-11-23T17:09:52Z

### L-025 - Assert that configuration values reach the adapter a factory builds, not only the adapter type
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `api-tests` · harmful: 0
- features: explanation-api
- evidence: M14 apps/api/src/game_analyzer/domains/explanation/infrastructure/provider_factory.py:16 (api-tests) (api-tests)
- last seen: 2026-11-23T17:09:52Z

### L-026 - Assert the exact error body and retry payload on every route and use case that shares a flow, not only on the first one
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `api-tests` · harmful: 0
- features: explanation-api
- evidence: M15 apps/api/src/game_analyzer/domains/explanation/api/router.py:58; M2b answer_question.py:27 (api-tests) (api-tests)
- last seen: 2026-11-23T17:09:52Z

### L-027 - Give every normalization rule a test where the normalized form must be accepted
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `api-verification` · harmful: 0
- features: explanation-api
- evidence: N9 apps/api/src/game_analyzer/domains/explanation/domain/verification.py:32 (api-verification) (api-verification)
- last seen: 2026-11-23T17:09:52Z

### L-028 - Expose visual board state such as square marks through an attribute and assert it, since tests cannot see CSS-only highlights
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `web-ui` · harmful: 0
- features: analysis-screen
- evidence: validation.md M29 AnalyzingScreen.tsx:28 (web-ui)
- last seen: 2026-11-23T17:23:33Z

### L-029 - Test numeric thresholds at the exact boundary value with synthetic data, not only with the reference game
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `domain-model` · harmful: 0
- features: analysis-screen
- evidence: validation.md M17 contract.ts:28 (domain-model)
- last seen: 2026-11-23T17:23:33Z

### L-030 - Derive every label shown with a board from the same ply index the board renders
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `web-ui` · harmful: 0
- features: analysis-screen
- evidence: AS-11 AnalyzingScreen.tsx:22-28,97-99 (web-ui)
- last seen: 2026-11-23T17:23:33Z

### L-031 - When a spec narrows a PRD list, record each dropped PRD item as an explicit decision in the spec
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `specs` · harmful: 0
- features: analysis-screen
- evidence: AS-14 vs general.md 7.2; step_02 stage times (specs)
- last seen: 2026-11-23T17:23:33Z

### L-032 - Probe a changed domain rule with a counterexample that should stay neutral before accepting a fix that only makes the reference fixture pass
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `domain-model` · harmful: 0
- features: analysis-screen
- evidence: validation.md round 2 N1 classify.ts:78-83 probe (domain-model)
- last seen: 2026-11-23T21:51:10Z

### L-033 - Make fakes reproduce the protocol race a fix targets, otherwise the fix is untested
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `engine` · harmful: 0
- features: analysis-screen
- evidence: validation.md round 2 R06 EngineClient.ts:106 (engine)
- last seen: 2026-11-23T21:51:10Z

### L-034 - Test every call site that wires a new parameter, not only the pure function that consumes it
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `machines` · harmful: 0
- features: analysis-screen
- evidence: validation.md round 2 R09 R10 R11 analysisMachine.ts:112-114 (machines)
- last seen: 2026-11-23T21:51:10Z

### L-035 - Test the final flush step of an incremental pipeline separately from the per-item step
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `machines` · harmful: 0
- features: analysis-screen
- evidence: validation.md round 3 T05 analysisMachine.ts:115-123 (machines)
- last seen: 2026-11-23T22:09:40Z

### L-036 - Isolate e2e tests that run a time-boxed CPU-bound engine from parallel workers, or assert only results that are stable under load
- signal: `gate_fail` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: analysis-screen
- evidence: validation.md round 3 E1 e2e/analysis.spec.ts:25 playwright.config.ts:10 (e2e)
- last seen: 2026-11-23T22:09:40Z

### L-037 - Assert the payload of every event a button sends, such as the target ply, not only the event type
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `web-tests` · harmful: 0
- features: review-screen
- evidence: M11+M12 / apps/web/src/domains/review/components/ReviewScreen.test.tsx:129-134 (RV-12) (web-tests)
- last seen: 2026-11-23T22:42:19Z

### L-038 - When a requirement lists several entry points for the same action, test each entry point and assert the full synced outcome
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `web-tests` · harmful: 0
- features: review-screen
- evidence: M15 / apps/web/src/domains/review/components/MoveList.tsx:50 (RV-10) (web-tests)
- last seen: 2026-11-23T22:42:19Z

### L-039 - Assert concrete fixture values instead of recomputing the expected value with the implementation formula
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `web-tests` · harmful: 0
- features: review-screen
- evidence: RV-02 / apps/web/src/domains/review/model/review.test.ts:45 (web-tests)
- last seen: 2026-11-23T22:42:19Z

### L-040 - When a test name promises something does not wait, assert it with fake timers so a hidden delay fails the test
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `web-tests` · harmful: 0
- features: analysis-screen
- evidence: S16 apps/web/src/domains/evaluation/engine/EngineClient.test.ts:323 (web-tests)
- last seen: 2026-11-24T02:51:03Z

### L-041 - Assert a spec-named timeout with a literal value, not by advancing timers by the imported constant
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `web-tests` · harmful: 0
- features: analysis-screen
- evidence: S09 apps/web/src/domains/evaluation/engine/EngineClient.test.ts:316 (web-tests)
- last seen: 2026-11-24T02:51:03Z

### L-042 - When an e2e accepts a variable count, also assert that every listed item belongs to the allowed set
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `e2e` · harmful: 0
- features: analysis-screen
- evidence: R4-3 apps/web/e2e/analysis.spec.ts:24 (e2e)
- last seen: 2026-11-24T02:51:03Z

### L-043 - In a multi-round validation report keep a single Result line for the latest round and relabel older rounds' results
- signal: `gate_fail` · recurrence: 1 feature(s) · scope: `specs` · harmful: 0
- features: analysis-screen
- evidence: .specs/features/analysis-screen/validation.md:434 validate_state unfilled verdict (specs)
- last seen: 2026-11-24T03:11:11Z

### L-044 - When the UI shows a counter or ordinal, drive it past its first value in a test and assert the exact second value
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `web-tests` · harmful: 0
- features: training-screen
- evidence: validation.md M20 (trainingMachine.ts:194) (web-tests) (web-tests)
- last seen: 2026-11-24T03:16:27Z

### L-045 - When a criterion says something must not be shown, assert its absence explicitly, not only the presence of the expected text
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `web-tests` · harmful: 0
- features: training-screen
- evidence: validation.md M21 (TrainingScreen.tsx:70), step_04 §7 AC2 (web-tests) (web-tests)
- last seen: 2026-11-24T03:16:27Z

### L-046 - Pin spec-defined timings and limits with literal values in tests instead of the exported constant
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `web-tests` · harmful: 0
- features: training-screen
- evidence: validation.md M06 (trainingMachine.ts:17) (web-tests) (web-tests)
- last seen: 2026-11-24T03:16:27Z

### L-047 - Give every color or shape highlight on the board a text equivalent in an accessible name and test it by role and name
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `web-a11y` · harmful: 0
- features: training-screen
- evidence: validation.md G4, step_04 §8 (web-a11y) (web-a11y)
- last seen: 2026-11-24T03:16:27Z

### L-048 - When a flow can start mid-sequence, state in the spec what totals and summaries count
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `specs` · harmful: 0
- features: training-screen
- evidence: validation.md G5, TR-11 (specs) (specs)
- last seen: 2026-11-24T03:16:27Z

### L-049 - When an accessible label describes a transient visual state, assert the label both while the state is on and after it ends
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `web-a11y` · harmful: 0
- features: training-screen
- evidence: validation.md round 2 N02 (TrainingScreen.tsx:144) (web-a11y) (web-a11y)
- last seen: 2026-11-24T03:16:27Z

### L-050 - When Portuguese text agrees in gender with a piece name, test both a masculine and a feminine piece
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `web-tests` · harmful: 0
- features: training-screen
- evidence: validation.md round 2 N05 (TrainingScreen.tsx:146) (web-tests) (web-tests)
- last seen: 2026-11-24T03:16:27Z

### L-051 - Pin sliding-piece blocker logic with a probe where the own king shields the line; extreme-value checks like max DTM do not exercise it
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `evaluation/tablebase` · harmful: 0
- features: endgame-tablebase
- evidence: apps/web/src/domains/evaluation/model/tablebase/generate.ts:99 (mutant 6) (evaluation/tablebase)
- last seen: 2026-11-24T03:37:56Z

### L-052 - When a machine gains a new state, add a component test that renders the screen in that state, including its headline and failure label
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `analysis/components` · harmful: 0
- features: endgame-tablebase
- evidence: apps/web/src/domains/analysis/components/AnalyzingScreen.tsx:75 (mutant 22) (analysis/components)
- last seen: 2026-11-24T03:37:56Z

### L-053 - Spec every status a UI indicator can show, including the failure state, not only the used and not-needed cases
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `review/footer` · harmful: 0
- features: endgame-tablebase
- evidence: TB-08 vs apps/web/src/domains/review/components/ReviewSidebar.tsx:141 (review/footer)
- last seen: 2026-11-24T03:37:56Z

### L-054 - When an engine score has an ambiguous sentinel (mate 0), test terminal overrides with a fixture where the other side wins, or the override hides the bug.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `analysis/model` · harmful: 0
- features: move-review
- evidence: M8 apps/web/src/domains/analysis/model/moveReview.ts:55 (analysis/model)
- last seen: 2026-11-24T13:23:29Z

### L-055 - When a label can be reached by two rules (engine move or zero loss), make every UI sentence key on the same rule as the label and pin it with a test.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `review/model` · harmful: 0
- features: move-review
- evidence: G2 apps/web/src/domains/review/model/coach.ts:61 (review/model)
- last seen: 2026-11-24T13:23:29Z

### L-056 - Guard test-infrastructure isolation (ports, server reuse, fake providers) with a cheap unit test on the config, since e2e passes either way when nothing else is running.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `e2e config` · harmful: 0
- features: move-review
- evidence: M28/M29 apps/web/playwright.config.ts:56 (e2e config)
- last seen: 2026-11-24T13:23:29Z

### L-057 - Each new allowed-facts builder needs its own rejection tests for both labeled and unlabeled moves, not only reuse of the shared verifier tests.
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `api verification` · harmful: 0
- features: move-review
- evidence: M27 apps/api/src/game_analyzer/domains/explanation/domain/verification.py:149 (api verification)
- last seen: 2026-11-24T13:23:29Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
