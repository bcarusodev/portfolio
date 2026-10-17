# Tasks: Harden Anonymous Chatbot Rate Limiting Against Abuse

## Review Workload Forecast

| Field                   | Value                    |
| ----------------------- | ------------------------ |
| Estimated changed lines | ~375 (370 code + config) |
| 400-line budget risk    | Medium                   |
| 800-line budget risk    | Low                      |
| Chained PRs recommended | No                       |
| Suggested split         | Single PR, 4 commits     |
| Delivery strategy       | auto-chain               |
| Chain strategy          | pending                  |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

**Pre-flight**: base is dirty `feature/chatbot-guardrails` — commit only this change's files, never the 6 baseline files.

Spec keys: R1 trust · R2 daily · R3 global · R4 contract · R5 log · R6 gates

### Suggested Work Units

| Unit | Goal                      | PR  | Focused test                              | Harness                                   | Rollback                                         |
| ---- | ------------------------- | --- | ----------------------------------------- | ----------------------------------------- | ------------------------------------------------ |
| 1    | IP resolver + tests       | 1   | `vitest run src/lib/ai/clientIp.test.ts`  | N/A: smoke via Unit 3                     | delete both new files                            |
| 2    | Daily/global caps + tests | 1   | `vitest run src/lib/ai/rateLimit.test.ts` | N/A: via Unit 3                           | revert `rateLimit.ts` + test                     |
| 3    | Route wiring, logs, knobs | 1   | `vitest run src/pages/api/chat.test.ts`   | `npm run dev` + POST burst → 429, one log | revert `chat.ts`, `chat.test.ts`, `.env.example` |
| 4    | Verify config + gates     | 1   | `npm test`                                | N/A: SDD config                           | revert `openspec/config.yaml`                    |

## Phase 1: Pre-flight

- [x] 1.1 Confirm branch + `git status` baseline; exclude the 6 dirty files from all commits. AC: base-branch risk contained. ~0

## Phase 2: IP Resolver (Unit 1)

- [x] 2.1 Create `src/lib/ai/clientIp.ts` (`getClientIp`: VERCEL=1 → leftmost XFF else socket/`"unknown"`; `hashIp`: sha256→16 hex) + `src/lib/ai/clientIp.test.ts`: both trust paths, array header, no-XFF, stable hash. AC R1/R6: +125

## Phase 3: Limiter Caps (Unit 2)

- [x] 3.1 `src/lib/ai/rateLimit.ts`: `readNonNegativeInt` (invalid→default; `readPositiveInt` untouched) + daily `{start,count}` store, `sweepDaily`, fixed 24h window, `AI_RATE_LIMIT_DAILY_MAX` default 60. AC R2: 61st→429/rollover/kill-valve · +35
- [x] 3.2 `src/lib/ai/rateLimit.ts`: global fixed 60s counter default 120; order minute→daily→global, first block wins, blocked mutates nothing; `reason?` on `IRateLimitResult`; `resetRateLimits()` clears all three stores. AC R3/R5: +30
- [x] 3.3 Create `src/lib/ai/rateLimit.test.ts`: daily 61st `≤86400`, `vi.setSystemTime` +24h rollover, 3rd arrival `global ≤60`, both `0` valves, custom values, precedence, reset. AC R2/R3/R6: +110

## Phase 4: Route Wiring (Unit 3)

- [x] 4.1 `src/pages/api/chat.ts`: swap local `getClientIp` for `clientIp.ts`; one `console.info` `{reason, ipHash, retryAfter}` per limiter 429 + `upstream` on pre-stream Groq 429; body/`Retry-After`/message unchanged. AC R4/R5: +20/−6
- [x] 4.2 `src/pages/api/chat.test.ts`: `VERCEL=1` via `beforeAll`/`afterAll` (else XFF collapses to 127.0.0.1); one log with reason+ipHash, raw IP absent, spoofed XFF off-Vercel, contract on daily/global 429. AC R4/R5/R6: +40

## Phase 5: Knobs & Verify Config (Unit 4)

- [x] 5.1 `.env.example`: document `AI_RATE_LIMIT_DAILY_MAX=60`, `AI_GLOBAL_RATE_LIMIT_MAX=120` with `0`-disables notes. AC R2/R3: +7
- [x] 5.2 `openspec/config.yaml`: `testing.runner: vitest`, `framework: vitest`, `command: "npm test"`, `layers.unit: true` → sdd-verify runs tests. AC R6: +5

## Phase 6: Quality Gates

- [x] 6.1 Run `npm test`, `npm run lint`, `tsc --noEmit`; `package.json` unchanged. AC R6: green, zero deps. ~0
