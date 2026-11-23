# F6 · AI explanation layer Validation

**Date**: 2026-11-23 (round 3, after fix commit `fe26f01`)
**Spec**: `.specs/features/explanation-api/spec.md` (EXP-05, EXP-07, EXP-08, EXP-12 and EXP-15 amended in `e1426b9`)
**Diff range**: `e31cb46..fe26f01` (spec `49284f1`; code `608ae96`, `58f3961`, `dce79d1`, `2c0ea85`; fixes `e1426b9`, `fe26f01`; reports `4366d4e`, `f70da22`)
**Verifier**: independent sub-agent (author ≠ verifier)

## Validation: PASS

Round 3 closes the last EXP-05 hole: unnumbered moves with a leading ellipsis (`...Dxh8`, `…Dxh8`) are now checked. Castling written with zeros is tested (N9). All 15 ACs match the spec outcome. Every non-equivalent mutant from rounds 1-3 is killed. Paths below are relative to `apps/api/src/game_analyzer/domains/explanation/`.

History: round 1 FAIL (EXP-01, EXP-05, EXP-06; 4 surviving mutants). Round 2 FAIL (`...Move` bypass; N9 survived). Round 3 PASS.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 Contract and verification | ✅ Done | Fixed in `e1426b9` and `fe26f01` |
| T2 Use cases, port and prompts | ✅ Done | - |
| T3 Providers | ✅ Done | - |
| T4 Routes, coverage gate, types, docs | ✅ Done | - |

---

## Spec-Anchored Acceptance Criteria

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| EXP-01 | 200; 5 fields; key-moment plies = contract; strengths for contract strengths | `tests/test_routes.py:36` `== 200`; `:38` `== [44, 54]`; `:39` `[s["ply"] ...] == [24]`; `:40` `set(body) == {...}` | ✅ PASS |
| EXP-02 | 422 on body outside contract | `tests/test_routes.py:51` `.status_code == 422` | ✅ PASS |
| EXP-03 | Versioned prompt file with level rules and contract JSON | `tests/test_use_cases.py:39-41` `load_prompt("explain_game", 1)`; `:46` `"Nível Iniciante: sem jargão" in prompt.system`; `:47` contract JSON in `prompt.user` | ✅ PASS |
| EXP-04 | Provider raises → 503 `{"detail": "ai_unavailable"}` | `tests/test_routes.py:58-59` (explanations); `:97-98` (questions) | ✅ PASS |
| EXP-05 | A move not in the contract, numbered or not (including a leading ellipsis), English or Portuguese letters, pawn captures, castling, is reported; spaces, check signs, `!`/`?` ignored | `tests/test_verification.py:43` `30...Txa2`; `:50` `Cf3`; `:86-89` parametrized `== [violation]` for `Nf3`, `Qxh7#`, `Kg1`, `exd5`, `gxh3`, `O-O-O`, `0-0`, `12…Txa2`, `30. e4`, `...Dxh8` (`:82`), `…Dxh8` (`:83`); `:95` `"Com ...Ta7 e …Ta7 ..." == []`; `:102` contract `6...O-O` accepts `0-0` and `6...0-0` → `[]` | ✅ PASS |
| EXP-06 | A square not in the contract's moves/pieces is reported | `tests/test_verification.py:60` `== ["casa h3 não está no contrato"]`; `:86-89` case `"Com Bd4 em h8 não dá."` → `["casa h8 ..."]` | ✅ PASS |
| EXP-07 | Integer not allowed, or any decimal, is reported | `tests/test_verification.py:65-66`; `:106-109` parametrized `+2,3`, `2.3`, `-0,5` → `["número decimal {d} não pode aparecer (avaliação inventada)"]` | ✅ PASS |
| EXP-08 | Verdict > 30 words; key-moment plies ≠ contract; strength plies ≠ contract | `tests/test_verification.py:122` (31 words); `:131` key moments; `:115` `== ["os pontos fortes não batem com o contrato"]` | ✅ PASS |
| EXP-09 | Retry once with violations; then 502 `explanation_unverified` | `tests/test_use_cases.py:60-61` `"lance Cf3 não está no contrato" in calls[1][1]`; `:68-69`; `tests/test_routes.py:73-74`, `:106-107` | ✅ PASS |
| EXP-10 | `POST /api/questions` (1–500 chars) → `{answer, in_scope}`, verified | `tests/test_routes.py:81-82`, `:86-90` (`""` and 501 chars → 422); `tests/test_use_cases.py:87-89` `"casa h3 não está no contrato" in calls[1][1]` | ✅ PASS |
| EXP-11 | Off-topic answer starts with "Só consigo falar sobre esta partida." | `tests/test_use_cases.py:95` exact `QuestionAnswer(...)`; `:104` no double prefix | ✅ PASS |
| EXP-12 | openai adapter with `AI_MODEL`/`OPENAI_API_KEY`; fake; other → 503 `ai_unavailable` + logged error, health works | `tests/test_providers.py:126`; `:142` `created == [("gpt-x", "sk-abc")]`; `:59` strict `json_schema`; `tests/test_routes.py:125-128` health 200, `503`, `{"detail": "ai_unavailable"}` | ✅ PASS |
| EXP-13 | openai + empty key → 503 `ai_unavailable`; health works | `tests/test_routes.py:116-119` | ✅ PASS |
| EXP-14 | `domain/` without FastAPI/LangChain; `application/` only on `domain/` + ports | Static read: `domain/contract.py:3-5` (typing, pydantic), `domain/verification.py:3-6` (re, dataclasses, contract), `application/ports.py:3-5`, `application/prompts.py:3-6`, `application/explain_game.py:3-6`, `application/answer_question.py:3-10` | ✅ PASS by inspection (no automated import guard; optional hardening) |
| EXP-15 | No key moments → empty list, accepted; fake verdict exact text | `tests/test_verification.py:148` `== []`; `tests/test_providers.py:97` `key_moments == []`; `:148` `== "Vitória sem perdas de material importantes: parabéns pela partida limpa."` | ✅ PASS |

**Status**: ✅ All 15 ACs covered with spec-anchored assertions; no spec-precision gaps.

### Probes (reference contract, `verify_text`, at `fe26f01`)

| Text | Violations | Expected |
| ---- | ---------- | -------- |
| `...Dxh8`, `…Dxh8`, `... Dxh8`, `22. ..Dxh8`, `…exd5` | reported | ✅ |
| `Nf3`, `exd5`, `O-O-O`, `12…Txa2`, `+2,3` | reported | ✅ |
| `...e4` | `casa e4` reported | ✅ |
| `...Ta7`, `Txa1 e Bd4+!`, `O resultado foi 0-1.` | `[]` (in the contract) | ✅ |

Cosmetic only: after a non-word character and a space (`Jogue: Nf3`), the match keeps the leading space, so the message reads `lance  Nf3 ...` with a double space. Detection is correct; only the feedback text sent back to the provider is affected.

---

## Discrimination Sensor

Each round ran in a fresh scratch worktree with `uv sync --locked` and `uv run pytest -q --no-cov` per mutant, restoring the file after each.

### Round 3 (at `fe26f01`)

| # | File:line | Mutation | Result |
| - | --------- | -------- | ------ |
| E1 | `domain/verification.py:21-23` | ellipsis prefix removed (round-2 regex restored) | ✅ Killed (2) |
| E2 | `domain/verification.py:83` | prefix not stripped before comparing | ✅ Killed |
| E3 | `domain/verification.py:22` | only ASCII `...` prefix accepted | ✅ Killed |
| N9 | `domain/verification.py:33` | `0-0` not normalized to `O-O` | ✅ Killed (`test_accepts_castling_written_with_zeros`) |
| N9b | `domain/verification.py:13` | castling with zeros not recognized | ✅ Killed |
| N1 | `domain/verification.py:12` | English piece letters dropped (regression check) | ✅ Killed (3) |
| N3 | `domain/verification.py:92` | decimal check dropped (regression check) | ✅ Killed (3) |
| N11 | `domain/verification.py:84` | unnumbered move check skipped (regression check) | ✅ Killed (15) |

### Earlier rounds

- **Round 1 (`2c0ea85`)**: 20 mutants, 16 killed. M2b, M13a, M14 and M15 survived.
- **Round 2 (`e1426b9`)**:
  - M2b, M13a, M14, M14b and M15 were killed.
  - Killed new-rule mutants: N1 English letters, N2 pawn captures, N3 decimals, N4 strengths, N5 unknown provider → 500, N6 castling, N7 `…` in labels, N8 `!`/`?` stripping, N10 standalone squares, N11 unnumbered moves.
  - N9 survived and is now killed in round 3.
  - N12 is equivalent: a label is the move number plus the SAN, so the square sets are identical.

**Sensor depth**: P0-style (verification is the product's safety net)
**Result**: every non-equivalent mutant across the three rounds is killed by the final tests. ✅ PASS
**Isolation**: each scratch was removed with `git worktree remove --force`; the real tree's `git status --porcelain` matched its pre-sensor baseline every time (empty).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code / surgical changes / no scope creep | ✅ |
| DDD layering (`docs/architecture/code-structure.md`) | ✅ |
| Spec-anchored outcome check | ✅ |
| Routes cover happy + edge + error with exact bodies | ✅ |
| Every test maps to a requirement | ✅ |
| Documented guidelines followed: `docs/engineering/quality.md` (verification of cited moves and numbers tested; no real provider in tests; domain/application ≥ 90%) | ✅ |
| Observability: logs carry only violation counts (`api/router.py:55,67`) | ✅ |

---

## Edge Cases

- [x] EXP-15 no key moments (`tests/test_verification.py:148`, `tests/test_providers.py:148`)
- [x] English notation, pawn captures, castling with letters or zeros, ellipsis-prefixed moves
- [x] Decimal numbers reported as invented evaluations
- [x] Unknown `AI_PROVIDER` → 503, health still 200

---

## Gate Check

- **Gate command**: `make check` (Node 26)
- **Result**: exit 0
  - Biome clean
  - Web Vitest: 210 passed
  - API pytest: 74 passed, total coverage 99%
  - `domain/` + `application/` coverage: 100% (204 statements, 0 missed)
- **API test count**: 9 before the feature → 53 (round 1) → 71 (round 2) → 74 (round 3); +65 in total
- **Skipped / failures**: none

---

## Residual notes (non-blocking)

1. Cosmetic: the violation message can carry a leading space (`domain/verification.py:86` uses the raw `match.group(0)`). Use the stripped token in the message.
2. Optional: an automated import guard for EXP-14.

---

## Requirement Traceability Update

| Requirement | Previous | New |
| ----------- | -------- | --- |
| EXP-01 … EXP-15 | Implementing / Needs Fix | ✅ Verified |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 15/15 ACs match the spec outcome
**Sensor**: all non-equivalent mutants killed (round 3: 8/8)
**Gate**: `make check` green; API 74 passed, web 210 passed

**What works**: closed contract (`extra="forbid"`), full-notation verification (moves, squares, integers, decimals, verdict length, key-moment and strength plies), retry-once with violations, 502/503 mapping with exact bodies, off-topic prefix, strict `json_schema` OpenAI adapter, configurable fake provider, clean layering, 100% domain/application coverage.
