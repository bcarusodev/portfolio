# Apply Progress: chatbot-guardrails

**Mode**: Standard (Strict TDD inactive; vitest harness introduced by this change)
**Artifact store**: hybrid (Engram + OpenSpec)
**Branch**: `feature/chatbot-guardrails` (stacked-to-main, auto-chain)
**Status**: 4/4 work units complete — Ready for verify

## Work Units

| Unit | Goal                                          | Commit                                       | SHA       |
| ---- | --------------------------------------------- | -------------------------------------------- | --------- |
| 1    | Vitest harness                                | `test: add vitest harness`                   | `89a8da3` |
| 2    | Prompt rules 10–12 + `GUARDRAIL_ES/EN`        | `feat: harden chatbot prompt rules`          | `1d142a5` |
| 3    | Pure `validateResponse` + fixture matrix      | `feat: add response guardrail validator`     | `a0c362f` |
| 4    | Buffer→validate→emit SSE gate + handler tests | `feat: gate chat SSE with output validation` | `0eb247d` |

## Unit 4 Review Notes (continuation)

Reviewed the pre-written uncommitted diff against `design.md` and `spec.md`:

- Gate placement: deltas buffered after `writeHead`; `validateResponse(buffer.join(""), { language })` runs before any client write — matches design data flow. No defects found; no rewrites performed.
- Bilingual fallback: single `delta` with `GUARDRAIL_EN`/`GUARDRAIL_ES` (from `normalizeLanguage(language) ?? "es"`) followed by `done`; logged via `console.error("[chat] guardrail violation:", { violation, chars, excerpt })` — matches spec "Output Gate and Safe Fallback".
- Preserved: first-delta pull before `writeHead` (upstream 429 → HTTP 429 + `Retry-After`, 5xx → HTTP 503), `AbortController` abort on client close mid-buffer (no in-band `error` on abort), IP rate limiting, mid-stream `error` event path, SSE `delta`/`done`/`error` contract.
- Prettier (lint-staged hook) reformatted `chat.test.ts` at commit time; gates re-run green on the committed state.

## Gate Results (post-commit, `0eb247d`)

| Gate                 | Command                                     | Result                        |
| -------------------- | ------------------------------------------- | ----------------------------- |
| Unit 4 focused tests | `npx vitest run src/pages/api/chat.test.ts` | 7/7 passed, exit 0            |
| Full test suite      | `npm test`                                  | 2 files, 30/30 passed, exit 0 |
| Type check           | `npx tsc --noEmit`                          | exit 0                        |
| Lint                 | `npm run lint`                              | exit 0                        |

## Work Unit Evidence — Unit 4

| Evidence                                          | Value                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused test command and exact result             | `npx vitest run src/pages/api/chat.test.ts` → 7 passed (7), exit 0                                                                                                                                                                                                                                                                                                                 |
| Runtime harness command/scenario and exact result | `chat.test.ts` spins up a real `node:http` OpenAI-compatible SSE mock (`AI_PROVIDER_BASE_URL`, test key) and drives the real provider adapter through the full handler: pass stream, violation→fallback, upstream 429, upstream 500, hang+client-close abort, IP rate limit → 30/30 suite green, exit 0. Manual `npm run dev` + `curl -N POST /api/chat` deferred to verify phase. |
| Rollback boundary                                 | Revert `src/pages/api/chat.ts` and delete `src/pages/api/chat.test.ts` (commit `0eb247d`) — removes only unit 4; units 1–3 unaffected.                                                                                                                                                                                                                                             |

## Changed Lines (units 1–4, `8a12249..0eb247d`)

- Authored (excluding `package-lock.json`): **818 lines** (810 insertions, 8 deletions) across 8 files
- Lockfile: +4143/−1283 (vitest devDependency churn, excluded from authored budget count)

Per-file authored: `chat.test.ts` +326, `guardrails.ts` +192, `guardrails.test.ts` +175, `tasks.md` +53, `prompt.ts` +14/−5, `vitest.config.ts` +18, `chat.ts` +29/−2, `package.json` +3/−1.

## Not Committed (intentionally)

`tsconfig.tsbuildinfo`, `.sdd-harness.*`, `.sdd-verify-stream.*`, `knowledge-extraction-prompt.md`, untracked `openspec/` planning files (proposal/design/exploration/specs remain untracked; `tasks.md` was committed with unit 1).

## Next

Ready for `verify`. Chain strategy resolved: stacked-to-main (per orchestrator).
