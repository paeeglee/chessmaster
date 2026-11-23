# F6 · AI explanation layer Validation

**Date**: 2026-11-23 (round 1)
**Spec**: `.specs/features/explanation-api/spec.md`
**Diff range**: `e31cb46..2c0ea85` (spec `49284f1`; code `608ae96`, `58f3961`, `dce79d1`, `2c0ea85`)
**Verifier**: independent sub-agent (author ≠ verifier)

## Validation: FAIL

The gate is green and 16 of 20 mutants are killed, but the verification rules (EXP-05, EXP-06) let whole families of invented moves and squares through, strengths are never checked against the contract (EXP-01), and four mutants survive. Paths below are relative to `apps/api/src/game_analyzer/domains/explanation/` unless they start with `apps/` or `Makefile`.

---

## Task Completion

| Task | Status | Notes |
| ---- | ------ | ----- |
| T1 Contract and verification | ⚠️ Partial | Verification misses English notation, pawn captures, castling and `N…move` labels (Gap 1); strengths not verified (Gap 3) |
| T2 Use cases, port and prompts | ✅ Done | Question retry feedback untested (M2b) |
| T3 Providers | ✅ Done | Factory model/key wiring untested (M14) |
| T4 Routes, coverage gate, types, docs | ✅ Done | `schema.gen.ts` regenerated; `.env.example`, `overview.md`, `CLAUDE.md`, `Makefile` updated |

---

## Spec-Anchored Acceptance Criteria

| ID | Spec-defined outcome | `file:line` + assertion | Result |
| -- | -------------------- | ----------------------- | ------ |
| EXP-01 | 200; `verdict`, `patterns_sentence`, one `key_moments` per contract moment (same plies, order), `strengths` for the contract strengths, `next_game_habit` | `tests/test_routes.py:36` `status_code == 200`; `:38` `[m["ply"] ...] == [44, 54]`; `:39` `set(body) == {...5 keys}`; `tests/test_providers.py:91` `strengths[0].text == "12...Bxa1 ganhou a torre em a1."` | ❌ GAP - strengths are never compared with the contract: `domain/verification.py:89-91` checks key-moment plies only. Probe: an explanation with `strengths=[]` for a contract with one strength verifies with `[]` violations |
| EXP-02 | 422 on a body outside the contract | `tests/test_routes.py:50` `.status_code == 422` (extra field, `extra="forbid"` at `domain/contract.py:16`) | ✅ PASS |
| EXP-03 | Prompt from versioned file in `prompts/`; includes level rules and contract JSON | `tests/test_use_cases.py:39-41` `load_prompt("explain_game", 1)`, `"{{contract_json}}" in user`; `:46` `"Nível Iniciante: sem jargão" in prompt.system`; `:47` `'"move_label": "22...Ta7"' in prompt.user` | ✅ PASS |
| EXP-04 | Provider raises → 503 `{"detail": "ai_unavailable"}` | `tests/test_routes.py:57-58` `status_code == 503`, `json() == {"detail": "ai_unavailable"}` | ✅ PASS (explanations). Questions route `tests/test_routes.py:96` asserts status only (M15 survives) |
| EXP-05 | A cited move not in the contract is reported | `tests/test_verification.py:43` `== ["lance 30...Txa2 não está no contrato"]`; `:50` `== ["lance Cf3 não está no contrato"]` | ❌ GAP (behavior) - probes against the reference contract return `[]` (no violation) for `Nf3`, `Qxh7#`, `Kg1`, `exd5`, `gxh3`, `dxe5`, `O-O-O`, `12…Txa2`. Cause: `domain/verification.py:14` (`\d+\s?\.(?:\.\.|…)?` needs a `.` before `…`), `:15` (piece class `[RDTBC]` only; no pawn captures, no castling), `:16` (`(?<![\w])` hides the square after a piece letter or `x`) |
| EXP-06 | A cited square not in the contract's moves/pieces is reported | `tests/test_verification.py:60` `== ["casa h3 não está no contrato"]` | ❌ GAP (behavior) - squares inside any token the move regexes skip are invisible (`exd5` → `d5`, `Nf3` → `f3`, `12…Txa2` → `a2`); same cause, `domain/verification.py:16` |
| EXP-07 | A cited integer not in the allowed numbers is reported | `tests/test_verification.py:65` `== ["número 7 não está no contrato"]`; `:66` `== []` for 72 and 3 | ✅ PASS for integers. ⚠️ Spec-precision gap: decimals are out of the AC, and `domain/verification.py:17` skips them, so invented evaluations `+2,3` and `2.3` pass, against general.md 7.2 / step_03 §5 "nunca inventar avaliações" |
| EXP-08 | Verdict > 30 words reported; key-moment plies ≠ contract reported | `tests/test_verification.py:71` `== ["a manchete passou de 30 palavras"]` (31 words); `:80` `== ["os momentos-chave não batem com o contrato"]` | ✅ PASS |
| EXP-09 | Retry once with the violations; second failure → 502 `{"detail": "explanation_unverified"}` | `tests/test_use_cases.py:60-61` `len(calls) == 2`, `"lance Cf3 não está no contrato" in calls[1][1]`; `:68-69` violations list and 2 calls; `tests/test_routes.py:72-73` `502`, `{"detail": "explanation_unverified"}` | ✅ PASS for explanations. Question use case retry feedback not asserted (M2b survives) |
| EXP-10 | `POST /api/questions` (question 1–500 chars) → `{answer, in_scope}`, verified | `tests/test_routes.py:80-81` `200`, `in_scope is True`; `:84-89` `""` and 501 chars → 422; `tests/test_use_cases.py:87` second (verified) answer returned; `tests/test_routes.py:104` 502 | ✅ PASS (inherits the EXP-05/06 verification holes) |
| EXP-11 | Off-topic answer starts with "Só consigo falar sobre esta partida." | `tests/test_use_cases.py:94-96` `== QuestionAnswer(answer="Só consigo falar sobre esta partida. Pergunte sobre 22...Ta7.", in_scope=False)`; `:103` no double prefix | ✅ PASS |
| EXP-12 | `openai` → LangChain adapter with `AI_MODEL` and `OPENAI_API_KEY`; `fake` → fake; other → clear error | `tests/test_providers.py:126` `isinstance(build_provider(...), expected)`; `:130` `match="AI_PROVIDER desconhecido: outro"`; `:58-59` `created == [("gpt-5.1", "sk-test")]`, `kwargs == {..."json_schema", "strict": True}` | ⚠️ PASS with gaps: the factory's model/key wiring is not asserted (M14 survives: hard-coding the model passes). Spec-precision gap: "fail at startup of the route" has no defined HTTP outcome; today `get_provider` (`api/router.py:28-29`) raises at request time → unhandled 500, untested at route level |
| EXP-13 | `openai` + empty key → routes 503 `ai_unavailable`; health keeps working | `tests/test_routes.py:113` health `200`; `:115` `status_code == 503`; `tests/test_providers.py:65` `ProviderError, match="OPENAI_API_KEY"` | ⚠️ PASS on status; `detail == "ai_unavailable"` not asserted on this path (same weakness as M15) |
| EXP-14 | `domain/` imports no FastAPI/LangChain; `application/` depends only on `domain/` and its ports | Static read: `domain/contract.py:3-5` (typing, pydantic); `domain/verification.py:3-6` (re, dataclasses, contract); `application/ports.py:3-5` (typing, pydantic); `application/prompts.py:3-6`; `application/explain_game.py:3-6`; `application/answer_question.py:3-10` (application + domain only) | ✅ PASS by inspection. No automated import guard (no test fails if a forbidden import is added) |
| EXP-15 | No key moments → empty `key_moments`, positive verdict (fake), verification accepts | `tests/test_verification.py:97` `verify_explanation(positive, clean) == []`; `tests/test_providers.py:97` `key_moments == []` | ⚠️ PASS with spec-precision gap: "positive verdict" is undefined and the fake's clean verdict (`infrastructure/fake_provider.py:75`) is never asserted |

**Status**: ❌ Gaps present (EXP-01, EXP-05, EXP-06) + ⚠️ spec-precision gaps (EXP-07, EXP-12, EXP-15)

### Verification probes (reference contract, `verify_text`)

| Text | Violations returned | Expected |
| ---- | ------------------- | -------- |
| `Nf3 era melhor.` | `[]` | move + square f3 |
| `Qxh7# dava mate.` / `Kg1` | `[]` | move |
| `exd5 ganhava.` / `gxh3` / `dxe5` | `[]` | move + square |
| `O-O-O era melhor.` | `[]` | move |
| `12…Txa2 perdeu.` | `[]` | move + square a2 |
| `A avaliação era +2,3.` / `2.3` | `[]` | invented evaluation |
| `Txh8`, `Dxh8+`, `30. Txa2`, `e4`, `-7 pontos` | reported | reported ✅ |

---

## Edge Cases

- [x] EXP-15 empty key moments accepted by verification (`tests/test_verification.py:90-97`)
- [ ] Moves written in English notation (glossary "Notação" lists both K Q R B N and R D T B C): not verified
- [ ] Decimal numbers (evaluations): not verified

---

## Discrimination Sensor

Scratch worktree `…/scratchpad/f6-sensor` at `HEAD`, `uv sync --locked`, `uv run pytest -q --no-cov` per mutant, file restored after each.

| # | File:line | Mutation | Result |
| - | --------- | -------- | ------ |
| M1 | `application/explain_game.py:9` | `MAX_ATTEMPTS = 1` (no retry) | ✅ Killed (3 failed) |
| M2a | `application/explain_game.py:27` | retry with `feedback=""` | ✅ Killed (`test_explain_retries_once_with_the_violations`) |
| M2b | `application/answer_question.py:27` | question retry with `feedback=""` | ❌ Survived |
| M3 | `domain/verification.py:75` | skip square check | ✅ Killed (2) |
| M4 | `domain/verification.py:79` | skip number check | ✅ Killed |
| M5 | `domain/verification.py:87` | allow 31-word verdict | ✅ Killed |
| M6 | `domain/verification.py:90` | ignore key-moment ply mismatch | ✅ Killed |
| M7a | `api/router.py:46,49,58,61` | 503↔502 swapped on both routes | ✅ Killed (5) |
| M7b | `api/router.py:58,61` | 503↔502 swapped on questions only | ✅ Killed (2) |
| M8 | `application/answer_question.py:40` | off-topic prefix not added | ✅ Killed |
| M9 | `infrastructure/openai_provider.py:43` | `strict=True` removed | ✅ Killed |
| M10 | `infrastructure/provider_factory.py:20` | unknown provider → `FakeProvider()` | ✅ Killed |
| M11 | `infrastructure/openai_provider.py:39` | empty key not rejected | ✅ Killed |
| M12 | `domain/verification.py:40` | best moves not allowed | ✅ Killed (11) |
| M13a | `domain/verification.py:66` | labels compared raw on the text side | ❌ Survived |
| M13b | `domain/verification.py:34,66` | labels compared raw on both sides | ✅ Killed |
| M14 | `infrastructure/provider_factory.py:16` | factory ignores `AI_MODEL` | ❌ Survived |
| M15 | `api/router.py:58` | questions 503 detail changed | ❌ Survived |
| M16 | `domain/verification.py:71` | skip piece-move check | ✅ Killed (6) |
| M17 | `application/answer_question.py:31` | questions not verified | ✅ Killed (3) |

**Sensor depth**: P0-style (20 manual mutants; the verification is the product's safety net)
**Result**: 16/20 killed - ❌ FAIL
**Isolation**: scratch removed with `git worktree remove --force`; real tree `git status --porcelain` equal to the baseline (empty before and after).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ |
| Surgical changes | ✅ |
| No scope creep | ✅ |
| Matches patterns (DDD layers per `docs/architecture/code-structure.md`) | ✅ |
| Spec-anchored outcome check | ❌ EXP-01, EXP-05, EXP-06 |
| Per-layer coverage (domain 1:1 ACs; routes happy + edge + error) | ⚠️ questions error paths assert status only |
| Every test maps to a spec requirement | ✅ |
| Documented guidelines followed: `docs/engineering/quality.md`, `docs/architecture/code-structure.md` | ⚠️ quality.md requires testing "a verificação automática que compara os números e lances citados"; English-notation and pawn-capture citations are untested and unverified |
| Observability "no game content" (spec sweep) | ⚠️ `api/router.py:48,60` log the violation strings, which quote moves and squares |

---

## Gate Check

- **Gate command**: `make check` (Node 26)
- **Result**: exit 0. Biome clean; web Vitest 210 passed (19 files); API pytest 53 passed, total coverage 99%; per-layer gate `domain/` + `application/` 100% (189 statements, 0 missed)
- **API test count before feature**: 9 (`e31cb46`: health 2, config 4, export 1, markers 2)
- **API test count after feature**: 53
- **Delta**: +44
- **Skipped tests**: none (the `llm` marker deselects none in this feature)
- **Failures**: none

---

## Fix Plans

### Fix 1 (Blocker): verification misses whole move/square families - EXP-05, EXP-06

- **Root cause**: `domain/verification.py:14-16`. Labels need a `.` before `…`; piece moves only match `[RDTBC]`; pawn captures and castling are never tokenized; `_SQUARE`'s `(?<![\w])` hides the square that follows a piece letter or `x`.
- **Fix task**: tokenize every SAN-like token (Portuguese and English piece letters, pawn captures `[a-h]x[a-h][1-8]`, castling `O-O(-O)?`, labels `\d+\s?(\.{1,3}|\.?…)`), and check every square, including those inside move tokens. Allowed English-letter moves must still be rejected, since the contract is in Portuguese notation.
- **Verify**: one `test_verification.py` case per probe above, each asserting the exact violation list.

### Fix 2 (Major): strengths not verified against the contract - EXP-01

- **Fix task**: in `verify_explanation`, require `[s.ply for s in explanation.strengths] == [s.ply for s in contract.strengths]` with its own message; assert strengths plies in `tests/test_routes.py:38`.

### Fix 3 (Major): decimal numbers (evaluations) pass - EXP-07 / general.md 7.2

- **Fix task**: amend EXP-07 to say any decimal number is a violation (the contract carries none), then report decimals in `verify_text`.

### Fix 4 (Major): surviving mutants

- M2b: in `tests/test_use_cases.py:78-88`, assert `"casa h3 não está no contrato" in provider.calls[1][1]`.
- M13a: add a test citing a contract label with spacing or a sign (e.g. `22... Ta7+`) that must verify as `[]`.
- M14: in `tests/test_providers.py:125-126`, assert the built `OpenAIProvider` received `ai_model`/`openai_api_key` from `Settings`, e.g. through a public attribute or a factory spy.
- M15 / EXP-13: assert `response.json() == {"detail": "ai_unavailable"}` at `tests/test_routes.py:96` and `:115`; also assert the 502 body at `:104`.

### Fix 5 (Minor): spec precision

- EXP-12: define the outcome for an unknown provider (e.g. fail in `create_app` at startup, or a 500 with a stated detail) and add a route-level test.
- EXP-15: define "positive verdict" (e.g. the exact fake text, or "no loss words") and assert it in `tests/test_providers.py:94-100`.
- EXP-14: optionally add an import-guard test that scans the `domain/` and `application/` imports.
- Observability: log violation counts or kinds, not the quoted moves (`api/router.py:48,60`).

---

## Requirement Traceability Update

| Requirement | Previous | New |
| ----------- | -------- | --- |
| EXP-01 | Implementing | ❌ Needs Fix |
| EXP-02, EXP-03, EXP-04, EXP-08, EXP-09, EXP-10, EXP-11, EXP-14 | Implementing | ✅ Verified |
| EXP-05, EXP-06 | Implementing | ❌ Needs Fix |
| EXP-07, EXP-12, EXP-13, EXP-15 | Implementing | ⚠️ Verified with gaps |

---

## Summary

**Overall**: ❌ Not Ready

**Spec-anchored check**: 3 ACs fail (EXP-01, EXP-05, EXP-06); 3 spec-precision gaps (EXP-07, EXP-12, EXP-15)
**Sensor**: 16/20 killed (M2b, M13a, M14, M15 survived)
**Gate**: `make check` green; API 53 passed, web 210 passed

**What works**: closed contract with `extra="forbid"`, retry-once flow, 502/503 mapping, off-topic prefix, strict `json_schema` structured output, fake provider end to end, clean layering, 100% domain/application coverage.

**Next steps**: route Fixes 1-4 to an implementer, then re-verify (round 2 of max 3).
