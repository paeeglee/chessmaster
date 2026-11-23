# F6 · AI explanation layer Validation

**Date**: 2026-11-23 (round 2, after fix commit `e1426b9`)
**Spec**: `.specs/features/explanation-api/spec.md` (EXP-05, EXP-07, EXP-08, EXP-12 and EXP-15 amended in `e1426b9`)
**Diff range**: `e31cb46..e1426b9` (spec `49284f1`; code `608ae96`, `58f3961`, `dce79d1`, `2c0ea85`; round-1 report `4366d4e`; fixes `e1426b9`)
**Verifier**: independent sub-agent (author ≠ verifier)

## Validation: FAIL

Round 2 closes every round-1 gap. Every round-1 survivor is now killed, the gate is green, and the probes from round 1 are reported. One EXP-05 behavior hole remains: an **unnumbered move written with a leading ellipsis** (`...Dxh8`, `…Dxh8`), the usual way to cite a Black move without its number, is never checked. The player is Black in the reference game, so this case is likely in real texts. Paths below are relative to `apps/api/src/game_analyzer/domains/explanation/`.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 Contract and verification | ⚠️ Partial | `...Move` / `…Move` bypass (Gap 1) |
| T2 Use cases, port and prompts | ✅ Done | - |
| T3 Providers | ✅ Done | - |
| T4 Routes, coverage gate, types, docs | ✅ Done | - |

---

## Spec-Anchored Acceptance Criteria

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| EXP-01 | 200; 5 fields; key-moment plies = contract; strengths for contract strengths | `tests/test_routes.py:36` `== 200`; `:38` `== [44, 54]`; `:39` `[s["ply"] ...] == [24]`; `:40` `set(body) == {...}` | ✅ PASS |
| EXP-02 | 422 on body outside contract | `tests/test_routes.py:51` `.status_code == 422` | ✅ PASS |
| EXP-03 | Versioned prompt file with level rules and contract JSON | `tests/test_use_cases.py:39-41`, `:46`, `:47` | ✅ PASS |
| EXP-04 | Provider raises → 503 `{"detail": "ai_unavailable"}` | `tests/test_routes.py:58-59` (explanations); `:97-98` (questions) | ✅ PASS |
| EXP-05 | A move not in the contract, numbered or not, English or Portuguese letters, pawn captures, castling, is reported; spaces, check signs and `!`/`?` are ignored | `tests/test_verification.py:43` `30...Txa2`; `:50` `Cf3`; `:84-87` parametrized `== [violation]` for `Nf3`, `Qxh7#`, `Kg1`, `exd5`, `gxh3`, `O-O-O`, `0-0`, `12…Txa2`, `30. e4`; `:92` `"22... Ta7+ ... 22…Ta7!" == []` | ❌ GAP (behavior) - `...Dxh8` and `…Dxh8` return `[]` (probe, reference contract). `domain/verification.py:21` excludes `.` and `…` in the lookbehind of `_UNLABELED_MOVE`, and `_LABELED_MOVE` (`:19`) needs a number, so the token is never checked. Its square is not standalone (`:24`), so the square check misses it too. Same for `22. ..Dxh8` |
| EXP-06 | A square not in the contract's moves/pieces is reported | `tests/test_verification.py:60` `== ["casa h3 ..."]`; `:84-87` case `"Com Bd4 em h8 não dá."` → `["casa h8 ..."]` | ✅ PASS (squares inside move tokens are covered through EXP-05, so they share Gap 1) |
| EXP-07 | Integer not allowed, or any decimal, is reported | `tests/test_verification.py:65-66`; `:96-99` parametrized `+2,3`, `2.3`, `-0,5` → `["número decimal {d} não pode aparecer (avaliação inventada)"]` | ✅ PASS |
| EXP-08 | Verdict > 30 words; key-moment plies ≠ contract; strength plies ≠ contract | `tests/test_verification.py:112` (31 words); `:121`; `:105` `== ["os pontos fortes não batem com o contrato"]` | ✅ PASS |
| EXP-09 | Retry once with violations; then 502 `explanation_unverified` | `tests/test_use_cases.py:60-61`, `:68-69`; `tests/test_routes.py:73-74`, `:106-107` | ✅ PASS |
| EXP-10 | `POST /api/questions` (1–500 chars) → `{answer, in_scope}`, verified (retry with violations) | `tests/test_routes.py:81-82`, `:86-90`; `tests/test_use_cases.py:87-89` `"casa h3 não está no contrato" in calls[1][1]` | ✅ PASS |
| EXP-11 | Off-topic answer starts with "Só consigo falar sobre esta partida." | `tests/test_use_cases.py:95`, `:104` | ✅ PASS |
| EXP-12 | openai adapter with `AI_MODEL`/`OPENAI_API_KEY`; fake; other → 503 `ai_unavailable` + logged error, health works | `tests/test_providers.py:126`; `:142` `created == [("gpt-x", "sk-abc")]`; `:59` strict json_schema; `tests/test_routes.py:125-128` health 200, `503`, `{"detail": "ai_unavailable"}` | ✅ PASS |
| EXP-13 | openai + empty key → 503 `ai_unavailable`; health works | `tests/test_routes.py:116-119` | ✅ PASS |
| EXP-14 | `domain/` without FastAPI/LangChain; `application/` only on `domain/` + ports | Static read: `domain/contract.py:3-5`, `domain/verification.py:3-6`, `application/*.py` imports (unchanged since round 1) | ✅ PASS by inspection (no automated guard) |
| EXP-15 | No key moments → empty list, accepted; fake verdict exact text | `tests/test_verification.py:138` `== []`; `tests/test_providers.py:97`; `:148` `== "Vitória sem perdas de material importantes: parabéns pela partida limpa."` | ✅ PASS |

**Status**: ❌ 1 AC with a behavior gap (EXP-05). No spec-precision gaps remain.

### Probes (reference contract, `verify_text`, at `e1426b9`)

| Text | Violations | Expected |
| ---- | ---------- | -------- |
| `Nf3`, `Qxh7#`, `Kg1`, `exd5`, `gxh3`, `O-O-O`, `12…Txa2`, `Nxe5`, `Dh5` | reported | ✅ |
| `+2,3`, `2.3` | reported as decimals | ✅ |
| `Txa1`, `Bd4+!`, `Rxg4`, `O resultado foi 0-1.` | `[]` (in the contract) | ✅ |
| `...Dxh8`, `…Dxh8`, `22. ..Dxh8` | `[]` | ❌ should report `Dxh8` |

---

## Discrimination Sensor (round 2)

Fresh scratch worktree at `e1426b9`, `uv sync --locked`, `uv run pytest -q --no-cov` per mutant, file restored after each.

| # | File:line | Mutation | Result |
| - | --------- | -------- | ------ |
| M2b | `application/answer_question.py:27` | question retry with `feedback=""` | ✅ Killed |
| M13a | `domain/verification.py:78` | labels compared without normalization | ✅ Killed (2) |
| M14 | `infrastructure/provider_factory.py:16` | factory ignores `AI_MODEL` | ✅ Killed |
| M14b | `infrastructure/provider_factory.py:16` | factory ignores the key (hard-coded `sk-other`) | ✅ Killed (a first attempt hard-coded the test's own `sk-abc` and was discarded as invalid) |
| M15 | `api/router.py:65` | questions 503 detail changed | ✅ Killed |
| N1 | `domain/verification.py:12` | English piece letters dropped | ✅ Killed (3) |
| N2 | `domain/verification.py:21` | pawn-capture check dropped | ✅ Killed (2) |
| N3 | `domain/verification.py:90` | decimal check dropped | ✅ Killed (3) |
| N4 | `domain/verification.py:107` | strengths check dropped | ✅ Killed |
| N5 | `api/router.py:32-36` | unknown provider → unhandled 500 | ✅ Killed |
| N6 | `domain/verification.py:21` | unnumbered castling dropped | ✅ Killed (2) |
| N7 | `domain/verification.py:19` | `…` no longer accepted in numbered labels | ✅ Killed |
| N8 | `domain/verification.py:33` | `!`/`?` not stripped | ✅ Killed (2) |
| N10 | `domain/verification.py:86` | standalone square check skipped | ✅ Killed (3) |
| N11 | `domain/verification.py:82` | unnumbered move check skipped | ✅ Killed (13) |
| N9 | `domain/verification.py:32` | `0-0` not normalized to `O-O` | ❌ Survived. Minor: no test cites a contract castling written as `0-0` (the spec lists `0-0` only as a move to report) |
| N12 | `domain/verification.py:68` | squares taken from SANs only, not labels | ➖ Equivalent: a label is the move number plus the SAN, so the square sets are identical |

**Sensor depth**: P0-style (17 mutants, all round-1 survivors re-run plus new rules)
**Result**: 15/16 non-equivalent mutants killed (N9 survived, minor)
**Isolation**: scratch removed with `git worktree remove --force`; real tree `git status --porcelain` equal to the pre-sensor baseline (empty).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code / surgical changes / no scope creep | ✅ |
| DDD layering (`docs/architecture/code-structure.md`) | ✅ |
| Spec-anchored outcome check | ❌ EXP-05 (Gap 1) |
| Routes cover happy + edge + error with exact bodies | ✅ |
| Every test maps to a requirement | ✅ |
| `docs/engineering/quality.md` (verification of cited moves and numbers tested) | ⚠️ Gap 1 |
| Observability: logs carry only violation counts | ✅ `api/router.py:55,67` |

---

## Gate Check

- **Gate command**: `make check` (Node 26)
- **Result**: exit 0. Biome clean; web Vitest 210 passed; API pytest 71 passed, total 99%; `domain/` + `application/` 100% (203 statements, 0 missed)
- **API tests**: 9 before the feature → 53 (round 1) → 71 (round 2)
- **Skipped / failures**: none

---

## Fix Plans

### Fix 1 (Major): unnumbered move with a leading ellipsis is not verified - EXP-05

- **Root cause**: `domain/verification.py:21`. The `(?<![\w.…])` lookbehind of `_UNLABELED_MOVE` was meant to skip the tail of a numbered label, but numbered labels are already removed from `remaining` (`:80`) before this pass. So it only hides moves written `...Dxh8` / `…Dxh8`, and their squares are never standalone.
- **Fix task**: let `_UNLABELED_MOVE` accept an optional `(?:\.\.\.|…)\s?` prefix (or drop `.`/`…` from the lookbehind), and normalize away the leading dots before comparing with `facts.moves`.
- **Verify**: add `("Depois de ...Dxh8 acabou.", "lance ...Dxh8 não está no contrato")` and `…Dxh8` to the parametrized test at `tests/test_verification.py:84`, and assert `"...Ta7 perdeu o bispo." == []` for a contract move.

### Fix 2 (Minor): `0-0` equivalence untested - N9

- Add a test where a contract with `O-O` accepts text citing `0-0` (or drop the normalization if that equivalence is not wanted).

---

## Requirement Traceability Update

| Requirement | Previous | New |
| ----------- | -------- | --- |
| EXP-01, EXP-07, EXP-12, EXP-13, EXP-15 | Needs Fix / gaps | ✅ Verified |
| EXP-02, EXP-03, EXP-04, EXP-06, EXP-08, EXP-09, EXP-10, EXP-11, EXP-14 | Verified | ✅ Verified |
| EXP-05 | Needs Fix | ❌ Needs Fix (ellipsis-prefixed moves only) |

---

## Summary

**Overall**: ❌ Not Ready (one narrow fix away)

**Spec-anchored check**: 14/15 ACs match the spec outcome; EXP-05 has one residual hole
**Sensor**: 15/16 non-equivalent mutants killed (N9 minor); all round-1 survivors killed
**Gate**: `make check` green; API 71 passed, web 210 passed

**Next steps**: apply Fix 1 (+ Fix 2), then re-verify (round 3 of max 3).
