```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:71a16cc07730b2bd54a5046f594889a8341b3f8c9e265a8da2818b8a6a548da0
verdict: pass
blockers: 0
critical_findings: 0
requirements: 5/5
scenarios: 12/12
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:d342e771c088b4f1fb3413cb9d2e9663edc44e3e6fac416416b94de48511b101
build_command: npx tsc --noEmit
build_exit_code: 0
build_output_hash: sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

## Verification Report

**Change**: chatbot-guardrails
**Spec version**: delta `openspec/changes/chatbot-guardrails/specs/chatbot-guardrails/spec.md` (ADDED: 5 requirements, 12 scenarios)
**Mode**: Standard (Strict TDD inactive; artifact store hybrid — Engram + OpenSpec)
**Branch**: `feature/chatbot-guardrails`, evidence revision = SHA-256 of the 40-character HEAD `85453aa949749dc047e35966c6b9e3efce670498` at verification time.

### Completeness

| Metric           | Value |
| ---------------- | ----- |
| Tasks total      | 10    |
| Tasks complete   | 10    |
| Tasks incomplete | 0     |

All task checkboxes in `tasks.md` match reality (phases 1–5 verified by source inspection plus runtime evidence). The committed copy of `tasks.md` still had 4.1, 4.2, and 5.1 unchecked while the working tree and the actual code showed them complete; this was fixed trivially in commit `85453aa` (`docs: mark chatbot-guardrails gate tasks complete`, 3 lines). Applied commits under verification: `89a8da3` (vitest harness), `1d142a5` (prompt hardening), `a0c362f` (validator), `0eb247d` (SSE gate + handler tests).

### Build & Tests Execution

**Build (type check)**: passed — `npx tsc --noEmit` exited 0 with empty output (envelope records the SHA-256 of that empty output).

**Tests**: 30 passed / 0 failed / 0 skipped — `npm test` (vitest v3.2.7): `src/lib/ai/guardrails.test.ts` (23 tests) passed, `src/pages/api/chat.test.ts` (7 tests) passed, 2 test files passed, 30/30 tests passed, exit 0.

**Lint**: `npm run lint` exited 0 — output SHA-256 `sha256:cf772208c50c2264e46b1ab58e78f728b489ac503f1e447790b4cde45bce419`.

**Coverage**: Not available — no coverage provider configured in the project; coverage is not one of the authorized gates for this change.

### Spec Compliance Matrix

| Requirement                                  | Scenario                                    | Test                                                                                                                                                                                                                                                                                             | Result    |
| -------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| Role, Scope, and Style Immutability          | In-scope query passes untouched             | `guardrails.test.ts > passes: legit knowledge-base query (ES)` and `(EN)`; `chat.test.ts > streams buffered deltas followed by done for a passing completion`                                                                                                                                    | COMPLIANT |
| Role, Scope, and Style Immutability          | Direct and indirect policy overwrite        | `guardrails.test.ts > blocks attack: direct policy overwrite accepted`; `blocks attack: indirect overwrite hidden in a story (roleplay)`                                                                                                                                                         | COMPLIANT |
| Role, Scope, and Style Immutability          | Roleplay and fake system instructions       | `guardrails.test.ts > blocks attack: fake SYSTEM line adopted`; `blocks attack: fake SYSTEM line adopted (EN)`                                                                                                                                                                                   | COMPLIANT |
| Role, Scope, and Style Immutability          | Multi-turn distributed manipulation         | `guardrails.test.ts > blocks attack: forged assistant turn in multi-turn history` (plus prompt rule 11, history-as-data)                                                                                                                                                                         | COMPLIANT |
| Valid Query With Incompatible Format Request | Imposed format not adopted                  | `guardrails.test.ts > passes: valid query with format request answered in natural language` (natural language, no refusal); `detects violation: whole response is imposed JSON (Respondeme en JSON)`; `chat.test.ts > emits the ES fallback plus done when validation fails (no violating text)` | COMPLIANT |
| Valid Query With Incompatible Format Request | Format mentioned in prose                   | `guardrails.test.ts > passes: format mentioned in prose (ES)`                                                                                                                                                                                                                                    | COMPLIANT |
| Valid Query With Incompatible Format Request | Organic code fence or table                 | `guardrails.test.ts > passes: organic code fence beside prose (rule 9)`; `passes: organic table beside prose (rule 9)`; also `passes: JSON snippet mid-prose`                                                                                                                                    | COMPLIANT |
| Output Gate and Safe Fallback                | Violating response never reaches the client | `chat.test.ts > emits the ES fallback plus done when validation fails (no violating text)` — exact event list asserted, violating text absent                                                                                                                                                    | COMPLIANT |
| Output Gate and Safe Fallback                | Bilingual fallback as normal deltas         | `chat.test.ts > emits the ES fallback plus done when validation fails (no violating text)` (asserts `console.error` called with `[chat] guardrail violation:` + class); `emits the EN fallback when language is en`                                                                              | COMPLIANT |
| Preserved Streaming and Error Behavior       | SSE contract and error mapping unchanged    | `chat.test.ts > streams buffered deltas followed by done for a passing completion`; `maps upstream 429 before the first delta to HTTP 429` (Retry-After 30); `maps upstream 5xx before the first delta to HTTP 503`                                                                              | COMPLIANT |
| Preserved Streaming and Error Behavior       | Client close and rate limit preserved       | `chat.test.ts > aborts the provider fetch on client close mid-buffer, without an error event`; `returns 429 for an IP over the rate limit`; ChatWidget untouched (manual check: `git diff 8a12249..HEAD -- "*ChatWidget*"` empty)                                                                | COMPLIANT |
| Authorized Test Verification                 | Test matrix and quality gates green         | This run: `npm test` 30/30 exit 0; `npm run lint` exit 0; `npx tsc --noEmit` exit 0; `vitest` present as devDependency (`^3.2.7`) with `"test": "vitest run"`                                                                                                                                    | COMPLIANT |

**Compliance summary**: 12/12 scenarios compliant, 5/5 requirements.

### Correctness (Static Evidence)

| Requirement                                  | Status      | Notes                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role, Scope, and Style Immutability          | Implemented | `prompt.ts` rules 10–12 appended (rule 9 intact); `guardrails.ts` first-match classes `role_claim` / `instruction_disclosure` with bilingual ES+EN phrase sets.                                                                                                                                                           |
| Valid Query With Incompatible Format Request | Implemented | JSON/XML/fence checks are whole-response scoped, so prose format mentions never fire; no refusal logic anywhere; fallback is neutral re-anchoring with no meta-talk.                                                                                                                                                      |
| Output Gate and Safe Fallback                | Implemented | `chat.ts` buffers every delta (including the first pull) after `writeHead`, validates `buffer.join("")`, then emits either buffered deltas or one `GUARDRAIL_ES`/`GUARDRAIL_EN` delta (default `es`) followed by `done`; violation logged via `console.error` with `{ violation, chars, excerpt }` (excerpt ≤ 200 chars). |
| Preserved Streaming and Error Behavior       | Implemented | First delta still pulled before `writeHead` (upstream 429 → HTTP 429 + Retry-After, 5xx → HTTP 503); `AbortController` on client close; IP rate limit; mid-stream `error` event path unchanged; `git diff 8a12249..HEAD --name-only` shows no ChatWidget file.                                                            |
| Authorized Test Verification                 | Implemented | vitest harness (`vitest.config.ts`, node env, `@` alias), 30 tests across 2 files, all three gates exit 0 on the committed state.                                                                                                                                                                                         |

### Coherence (Design)

| Decision                                                                | Followed? | Notes                                                                                                                          |
| ----------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Server SSE gate as enforcement point (not prompt-only, not client-side) | Yes       | Validation runs in `chat.ts` before any client write; prompt rules are defense-in-depth only.                                  |
| Structural heuristics, model judge deferred                             | Yes       | `guardrails.ts` is pure, zero-dependency, no I/O; logging lives in the route.                                                  |
| Full bounded buffer, 16 384-char cap, fail-closed                       | Yes       | `MAX_RESPONSE_CHARS = 16384`; oversize returns a violation verdict.                                                            |
| Immediate fallback + structured log (no retry)                          | Yes       | Single `delta` + `done`, never `error` on the guardrail path.                                                                  |
| First-match-wins class order                                            | Yes       | whole_response_json → whole_response_xml → tag_wrapping → code_fence_framing → role_claim → instruction_disclosure → oversize. |
| Prompt rules 10–12 added, rules 1–9 intact                              | Yes       | Diff of `prompt.ts` shows only the doc-comment update, `GUARDRAIL_ES/EN` exports, and rules 10–12; rule 9 preserved verbatim.  |
| Fallback selection `normalizeLanguage(body.language)` default `es`      | Yes       | `chat.ts` uses `normalizeLanguage(language) ?? "es"`.                                                                          |
| Data flow: first delta before `writeHead`, remaining deltas buffered    | Yes       | Matches design diagram; abort/mid-stream `error` paths untouched.                                                              |

### Issues Found

**CRITICAL**: None.

**WARNING**: None.

**SUGGESTION**:

1. Live end-to-end smoke (`npm run dev` + `curl -N POST /api/chat` against a real provider) was deferred from apply and remains unrun; the integration tests exercise the real provider adapter through a local SSE mock, but actual LLM adherence to prompt rules 10–12 can only be confirmed against a live model.
2. `validateResponse(text, ctx)` accepts `ctx.language` but never uses it (phrase sets are bilingual by design); either drop the field or include `language` in the `chat.ts` violation log to support the design's future phrase-list tuning.
3. Broad role-claim phrases such as `sin restricciones` / `unrestricted` could false-positive on a legitimate answer that quotes such wording; tune phrase lists from logged violation classes per the design's open question (non-blocking).

### Verdict

**PASS** — every spec requirement and scenario has a covering test that passed at runtime (12/12), all three quality gates exit 0 on the committed state, design decisions are followed with no deviation, and ChatWidget is untouched.
