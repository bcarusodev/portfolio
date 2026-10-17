# Apply Progress: avoid-malicious-rate-limiting-anonymous-chatbot

**Status**: success — 10/10 tasks complete · Mode: Standard (strict_tdd: false)
**Branch**: feature/chatbot-guardrails · Delivery: single PR, 4 work-unit commits
**Review budget**: 800 lines; actual ~614 changed lines (597+/17−; ~430 are test lines — forecast ~375 undercounted test volume; still under budget, no chaining)

## Commits (work units)

| #   | SHA       | Message                                                                        |
| --- | --------- | ------------------------------------------------------------------------------ |
| 1   | `8af0e02` | feat(ai): add VERCEL-gated client IP resolver                                  |
| 2   | `af3defa` | feat(ai): add per-IP daily cap and global arrival cap to rate limiter          |
| 3   | `bfa84b9` | feat(api): wire hardened rate limiting and structured 429 logs into chat route |
| 4   | `30f4133` | chore: document rate-limit env knobs and enable vitest in openspec config      |

## Tasks

- [x] 1.1 Pre-flight: branch + dirty baseline confirmed; the 6 baseline files never staged
- [x] 2.1 `src/lib/ai/clientIp.ts` + `clientIp.test.ts` (10 tests)
- [x] 3.1 `rateLimit.ts`: `readNonNegativeInt` + daily `{start,count}` store, `sweepDaily`, 24h window, default 60
- [x] 3.2 `rateLimit.ts`: global 60s counter default 120; order minute→daily→global; `reason?`; full `resetRateLimits()`
- [x] 3.3 `rateLimit.test.ts` (16 tests): daily/rollover/global/kill-valves/custom/precedence/reset/mutation-on-block
- [x] 4.1 `chat.ts`: `clientIp.ts` resolver; one structured `console.info` per HTTP 429 (`minute|daily|global|upstream` + sha256-16 `ipHash`); contract untouched
- [x] 4.2 `chat.test.ts`: `VERCEL=1` via beforeAll/afterAll; log assertions; spoofed-XFF off-Vercel; daily/global contract (11 tests)
- [x] 5.1 `.env.example`: `AI_RATE_LIMIT_DAILY_MAX=60`, `AI_GLOBAL_RATE_LIMIT_MAX=120` with 0-disables notes
- [x] 5.2 `openspec/config.yaml`: runner/framework vitest, command `npm test`, `layers.unit: true`
- [x] 6.1 Quality gates green; `package.json` unchanged (zero new deps)

## Work Unit Evidence

### Unit 1 — IP resolver (`8af0e02`)

| Evidence        | Value                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Focused test    | `npx vitest run src/lib/ai/clientIp.test.ts` → 10/10 passed                                      |
| Runtime harness | N/A — pure function with no runtime boundary; smoke-covered end-to-end by Unit 3's handler tests |
| Rollback        | Delete `src/lib/ai/clientIp.ts` + `src/lib/ai/clientIp.test.ts`                                  |

### Unit 2 — Limiter caps (`af3defa`)

| Evidence        | Value                                                                  |
| --------------- | ---------------------------------------------------------------------- |
| Focused test    | `npx vitest run src/lib/ai/rateLimit.test.ts` → 16/16 passed           |
| Runtime harness | N/A at this unit — exercised through the real handler in Unit 3        |
| Rollback        | `git revert af3defa` (revert `rateLimit.ts` + test; Unit 1 unaffected) |

### Unit 3 — Route wiring (`bfa84b9`)

| Evidence        | Value                                                                                                                                                                                                                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused test    | `npx vitest run src/pages/api/chat.test.ts` → 11/11 passed                                                                                                                                                                                                                                                                        |
| Runtime harness | The same suite drives the real handler through the real provider adapter against a live `node:http` OpenAI-compatible mock (real fetch/AbortController path), including limiter/upstream/daily/global 429s — covers the pre-stream 429 boundary the tasks table's `npm run dev` burst would probe; no separate dev server started |
| Rollback        | `git revert bfa84b9` (revert `chat.ts` + `chat.test.ts`)                                                                                                                                                                                                                                                                          |

### Unit 4 — Knobs & verify config (`30f4133`)

| Evidence        | Value                                                                 |
| --------------- | --------------------------------------------------------------------- |
| Focused test    | `npm test` → 5 files, 75/75 passed                                    |
| Runtime harness | N/A — configuration/docs only                                         |
| Rollback        | `git revert 30f4133` (revert `.env.example` + `openspec/config.yaml`) |

## Quality Gates (task 6.1)

| Command            | Result                               |
| ------------------ | ------------------------------------ |
| `npm test`         | exit 0 — 5 files, 75/75 tests passed |
| `npm run lint`     | exit 0                               |
| `npx tsc --noEmit` | exit 0                               |
| `package.json`     | unchanged — zero new dependencies    |

## Deviations from Design

- `readNonNegativeInt` additionally treats an **empty-string** env value (`FOO=`) as invalid → default, instead of `Number("") === 0` silently disabling the cap. Consistent with the "invalid → default" rule; prevents an accidental kill valve.
- Design's ~370-line estimate undercounted test volume (actual ~614 changed lines incl. deletions); still single-PR under the 800-line budget as authorized (no chaining triggered, no size exception needed).
- The getProvider() synchronous catch in `chat.ts` can only map to 503 (factory/unknown-provider errors), so "one log per HTTP 429" needs no fourth log site — verified in `provider.ts`.

## Git Safety

- Baseline dirty files (`ChatWidget/MessageInput.tsx`, `ChatWidget/index.tsx`, `ContactButtons/index.tsx`, `constants.ts`, `pages/index.tsx`, `tsconfig.tsbuildinfo`) were never staged; working tree after the run shows only those + the untracked change dir.
- `openspec/changes/avoid-malicious-rate-limiting-anonymous-chatbot/` not committed.

## Issues Found

None blocking. Note: `openspec/config.yaml` `context:` block still says "No test suite configured" (stale text, outside task 5.2's field list — left untouched).
