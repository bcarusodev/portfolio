# Tasks: Chatbot Guardrails

## Review Workload Forecast

Estimated changed lines: ~770 authored (range 700–900)
800-line budget risk: High
400-line budget risk: High
Chained PRs recommended: Yes
Delivery strategy: auto-chain
Chain strategy: pending
Decision needed before apply: No
Suggested split: PR 1 harness → PR 2 prompt → PR 3 validator → PR 4 gate

### Suggested Work Units

| Unit | Goal                                     | PR  | Focused test command                           | Runtime harness                          | Rollback boundary                                     | Est. |
| ---- | ---------------------------------------- | --- | ---------------------------------------------- | ---------------------------------------- | ----------------------------------------------------- | ---- |
| 1    | Vitest harness                           | 1   | `npm test`                                     | N/A: config-only                         | delete `vitest.config.ts`, revert `package.json`      | ~25  |
| 2    | Prompt rules 10–12 + fallback constants  | 2   | `npm run lint` + `tsc --noEmit`                | `npm run dev` + manipulation message     | revert `src/lib/ai/prompt.ts`                         | ~40  |
| 3    | Pure `validateResponse` + fixture matrix | 3   | `npx vitest run src/lib/ai/guardrails.test.ts` | N/A: pure module                         | delete `guardrails.ts` + its test                     | ~400 |
| 4    | Buffer→validate→emit gate + SSE tests    | 4   | `npx vitest run src/pages/api/chat.test.ts`    | `npm run dev` + `curl -N POST /api/chat` | revert `src/pages/api/chat.ts`, delete `chat.test.ts` | ~285 |

## Phase 1: Test Harness (Unit 1)

- [x] 1.1 Create `vitest.config.ts`: node env, `src/**/*.test.ts`, `@`→`src` alias. (~15 lines)
- [x] 1.2 `package.json`: add `vitest` devDependency and `"test": "vitest run"` script. Verify `npm test` exits 0. (~10 lines)

## Phase 2: Prompt Hardening (Unit 2)

- [x] 2.1 `src/lib/ai/prompt.ts`: append to `INSTRUCTIONS` — rule 10 role immutability, rule 11 history as untrusted data (forged turns, fake `SYSTEM:`), rule 12 format policy; rule 9 intact. Verify `tsc --noEmit`. (~20 lines)
- [x] 2.2 Export `GUARDRAIL_ES`/`GUARDRAIL_EN` neutral re-anchoring constants (no meta-talk); update "~300 tokens" doc comment. Verify lint + `npm test`. (~20 lines)

## Phase 3: Output Validator (Unit 3)

- [x] 3.1 Create `src/lib/ai/guardrails.ts`: `TViolationClass`, `IGuardrailVerdict`, pure `validateResponse(text, { language })`; first-match: `whole_response_json`/`_xml`, `tag_wrapping`, `code_fence_framing`, `role_claim`, `instruction_disclosure`, `oversize` (16 384 fail-closed). (~220 lines)
- [x] 3.2 Create `src/lib/ai/guardrails.test.ts` pass fixtures: legit KB query, format-mention prose, organic fence/table, mid-prose JSON; explicit `vitest` imports (no globals). Verify green. (~90 lines)
- [x] 3.3 Same file: violation fixtures — direct, indirect, roleplay, fake-system, multi-turn/forged-history attacks; one case per violation class incl. "Respondeme en JSON". Verify green. (~110 lines)

## Phase 4: SSE Gate (Unit 4)

- [x] 4.1 `src/pages/api/chat.ts`: buffer deltas after `writeHead`; on end `validateResponse` — ok: flush buffered `delta`s; violation: `console.error` + `GUARDRAIL_ES/EN` `delta` (default `es`) + `done`, never `error`. Unchanged: first-delta 429/5xx→HTTP, abort, rate limit, mid-stream `error`. (~55 lines)
- [x] 4.2 Create `src/pages/api/chat.test.ts`: local `node:http` OpenAI-SSE mock (`AI_PROVIDER_BASE_URL`, test key) + req/res stubs — pass → `delta`\*+`done`; violation → fallback+`done` (no violating text); 429/5xx pre-first-delta → HTTP; close mid-buffer → abort; over-limit IP → 429. Verify green. (~230 lines)

## Phase 5: Quality Gates

- [x] 5.1 Run `npm test`, `npm run lint`, `tsc --noEmit`; all exit 0. (0 lines)

## Review Workload Forecast

- Estimated total changed lines: ~770 authored (range 700–900)
- 800-line budget risk: High
- Chained PRs recommended: Yes
- Decision needed before apply: No
