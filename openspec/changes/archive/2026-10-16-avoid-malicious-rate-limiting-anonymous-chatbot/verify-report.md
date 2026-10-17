```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:3daa3e65294f1c4e0296f7ae098593c4d704e65a753ff4d70f37b218244da1f4
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 6/6
scenarios: 11/11
test_command: npm test
test_exit_code: 0
test_output_hash: sha256:e20562fc752c8952d05dde71e9995743f5f718cc711d13a225432f12c616ec2d
build_command: npx tsc --noEmit
build_exit_code: 0
build_output_hash: sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

## Verification Report

**Change**: avoid-malicious-rate-limiting-anonymous-chatbot
**Spec version**: delta `openspec/changes/avoid-malicious-rate-limiting-anonymous-chatbot/specs/chatbot-rate-limiting/spec.md` (ADDED: 6 requirements, 11 scenarios; Engram #52 byte-identical to the OpenSpec copy)
**Mode**: Standard (Strict TDD inactive; artifact store hybrid — Engram + OpenSpec)
**Branch**: `feature/chatbot-guardrails`; evidence revision = SHA-256 of the 40-char HEAD `30f4133e695558d252876411afef33f69bad61c5` at verification time.
**Commits under verification**: `8af0e02` (IP resolver), `af3defa` (limiter caps), `bfa84b9` (route wiring), `30f4133` (knobs + config). Diff scope: 8 files, 597+/17−; no ChatWidget file, no `package.json`/`package-lock.json` touched.

### Completeness

| Metric           | Value |
| ---------------- | ----- |
| Tasks total      | 10    |
| Tasks complete   | 10    |
| Tasks incomplete | 0     |

All `[x]` checkboxes in `tasks.md` match reality — each claim re-verified against source and runtime evidence (phases 1–6: pre-flight, resolver, limiter caps, route wiring, knobs/config, gates). Engram apply-progress (#58) agrees with the on-disk state. The 6 pre-existing dirty baseline files (`ChatWidget/MessageInput.tsx`, `ChatWidget/index.tsx`, `ContactButtons/index.tsx`, `constants.ts`, `pages/index.tsx`, `tsconfig.tsbuildinfo`) remain uncommitted and absent from all 4 commits.

### Build & Tests Execution

**Build (type check)**: ✅ Passed — `npx tsc --noEmit` exited 0 with empty output (envelope records SHA-256 of that empty output, the canonical `e3b0c442…` digest).

**Tests**: ✅ 75 passed / ❌ 0 failed / ⚠️ 0 skipped

```text
$ npm test   (vitest v3.2.7 run)
  ✓ src/lib/ai/clientIp.test.ts (10 tests)      7ms
  ✓ src/lib/ai/guardrails.test.ts (30 tests)   13ms
  ✓ src/lib/ai/rateLimit.test.ts (16 tests)    20ms
  ✓ src/components/Molecules/ChatWidget/markdownComponents.test.ts (8 tests) 33ms
  ✓ src/pages/api/chat.test.ts (11 tests)     532ms
  Test Files  5 passed (5)
       Tests  75 passed (75)
  EXITCODE=0
  TEST_OUTPUT_HASH=sha256:e20562fc752c8952d05dde71e9995743f5f718cc711d13a225432f12c616ec2d
```

Regression check: `src/lib/ai/guardrails.test.ts` (30 tests, pre-existing guardrail coverage) still passes inside the full suite.

**Lint**: ✅ `npm run lint` exited 0 — output SHA-256 `sha256:fddc8af2bbda0fed050614c37735a720def50518ff93b893c2e170b99e7b4ad7`.

**Coverage**: ➖ Not available — no coverage provider configured; coverage is not an authorized gate for this change.

### Spec Compliance Matrix

| Requirement                         | Scenario                          | Test                                                                                                                                                                                                                                                                                                                                                                                                                                        | Result       |
| ----------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| R1 Trustworthy Client IP Resolution | XFF spoofing off-Vercel ignored   | `src/lib/ai/clientIp.test.ts > ignores a forged XFF header off-Vercel and uses the socket address`; `ignores a multi-entry forged XFF header off-Vercel`; route-level `src/pages/api/chat.test.ts > ignores a spoofed XFF header when the VERCEL marker is unset` (same-socket bucket 429 proves the forged IP never keyed the limiter)                                                                                                     | ✅ COMPLIANT |
| R1 Trustworthy Client IP Resolution | VERCEL env present                | `clientIp.test.ts > trusts the leftmost XFF entry when VERCEL=1` (GIVEN `203.0.113.9, 10.0.0.1` → `203.0.113.9`); plus array-valued header and trim variants                                                                                                                                                                                                                                                                                | ✅ COMPLIANT |
| R2 Per-IP RPM and Daily Caps        | 61st request in a day rejected    | `src/lib/ai/rateLimit.test.ts > blocks the 61st request of the day with Retry-After within 86400s` (60 allowed, 61st blocked, `reason: "daily"`, 1 ≤ retryAfter ≤ 86400); route contract `chat.test.ts > keeps the 429 contract and logs reason daily on a daily-cap rejection` (`Retry-After` header defined)                                                                                                                              | ✅ COMPLIANT |
| R2 Per-IP RPM and Daily Caps        | Daily window rollover             | `rateLimit.test.ts > starts a fresh counter after the fixed 24h window rolls over` (`vi.setSystemTime(+86_400_000)` → accepted)                                                                                                                                                                                                                                                                                                             | ✅ COMPLIANT |
| R2 Per-IP RPM and Daily Caps        | Kill valve and env-tunable value  | `rateLimit.test.ts > disables the daily cap when AI_RATE_LIMIT_DAILY_MAX=0` (61/61 allowed); `applies a custom AI_RATE_LIMIT_DAILY_MAX value`; `falls back to the default cap when the env value is invalid or empty`                                                                                                                                                                                                                       | ✅ COMPLIANT |
| R3 Global Arrival Cap               | Global cap exceeded               | `rateLimit.test.ts > blocks the 3rd arrival in the window from any IP with Retry-After ≤ 60s` (three distinct IPs); route log `chat.test.ts > keeps the 429 contract and logs reason global on a global-cap rejection` (asserts `reason: "global"`)                                                                                                                                                                                         | ✅ COMPLIANT |
| R3 Global Arrival Cap               | Kill valve and env-tunable value  | `rateLimit.test.ts > disables the global cap when AI_GLOBAL_RATE_LIMIT_MAX=0` (200 arrivals allowed); `applies a custom AI_GLOBAL_RATE_LIMIT_MAX value`; `resets the global window after 60s`                                                                                                                                                                                                                                               | ✅ COMPLIANT |
| R4 429 Client Contract Preservation | Contract preserved on limiter 429 | `chat.test.ts > returns 429 for an IP over the rate limit`; `keeps the 429 contract and logs reason daily…` and `…global…` both assert `{error: "rate_limit", message: "Please wait a moment…"}` + `Retry-After`; `git diff 8af0e02~1..30f4133 -- src/pages/api/chat.ts` shows the 429 body/message as untouched context lines                                                                                                              | ✅ COMPLIANT |
| R4 429 Client Contract Preservation | Upstream Groq 429 mapping         | `chat.test.ts > maps upstream 429 before the first delta to HTTP 429` — `Retry-After: 30`, `{error: "rate_limit"}`, zero events, `console.info` once with `reason: "upstream"`                                                                                                                                                                                                                                                              | ✅ COMPLIANT |
| R5 Structured 429 Logging           | One log per rejection             | `chat.test.ts > emits exactly one structured log with reason and ipHash on a limiter 429` — `toHaveBeenCalledTimes(1)`, payload `{reason, ipHash: /^[0-9a-f]{16}$/ , retryAfter}`, logged JSON contains neither the raw IP nor message text; daily test also asserts count 1; source `chat.ts:99-103` and `chat.ts:179-183` are the only two HTTP-429 log sites (verified: `getProvider()` sync catch is always 503, `provider.ts:157-166`) | ✅ COMPLIANT |
| R6 Tests and Quality Gates          | Quality gates green               | This run: `npm test` exit 0 (75/75); `npm run lint` exit 0; `npx tsc --noEmit` exit 0; `git diff 8af0e02~1..30f4133 -- package.json package-lock.json` empty → zero new packages                                                                                                                                                                                                                                                            | ✅ COMPLIANT |

**Compliance summary**: 11/11 scenarios compliant, 6/6 requirements.

### Correctness (Static Evidence)

| Requirement                         | Status         | Notes                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1 Trustworthy Client IP Resolution | ✅ Implemented | `src/lib/ai/clientIp.ts:14-25` — `process.env.VERCEL === "1"` gate; leftmost non-empty trimmed XFF entry only under the marker; else `req.socket.remoteAddress \|\| "unknown"`. Route imports the dedicated resolver; the old inline spoofable `getClientIp` was deleted from `chat.ts`.                                   |
| R2 Per-IP RPM and Daily Caps        | ✅ Implemented | `rateLimit.ts` keeps the sliding minute window (`DEFAULT_MAX = 30`) and adds `daily` Map `{start,count}` with `DAILY_WINDOW_MS = 86_400_000`, `readNonNegativeInt` (`AI_RATE_LIMIT_DAILY_MAX`, default 60, `0` disables), `sweepDaily` mirroring `sweep` at `MAX_TRACKED_IPS`.                                             |
| R3 Global Arrival Cap               | ✅ Implemented | Module-global `globalStart`/`globalCount` fixed 60s window (`AI_GLOBAL_RATE_LIMIT_MAX`, default 120, `0` disables); block path returns 429-able result with `retryAfter ≤ 60` regardless of IP.                                                                                                                            |
| R4 429 Client Contract Preservation | ✅ Implemented | `chat.ts` limiter and upstream 429 branches both return `{error: "rate_limit", message: <unchanged widget text>, retryAfter}` with `Retry-After` header; cause differentiation exists only in the structured log (`reason`). ChatWidget files untouched by all 4 commits (`git diff --name-only` has no ChatWidget match). |
| R5 Structured 429 Logging           | ✅ Implemented | Exactly one `console.info("[chat] rate limited:", {reason, ipHash, retryAfter})` per HTTP 429 (limiter branch + pre-stream upstream branch); `hashIp` = sha256 → first 16 hex (`clientIp.ts:33-35`); raw IP never logged.                                                                                                  |
| R6 Tests and Quality Gates          | ✅ Implemented | 37 change-specific tests across 3 files (10 + 16 + 11), all passing in the 75-test suite; `.env.example` documents both knobs with `0`-disables notes; `openspec/config.yaml` `testing:` block now declares runner/framework `vitest`, command `npm test`, `layers.unit: true`; `package.json` unchanged.                  |

### Coherence (Design)

| Decision                                                                                                                | Followed? | Notes                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Leftmost XFF only when `VERCEL === "1"`, else socket                                                                    | ✅ Yes    | `clientIp.ts:15-24`; tests cover both trust paths plus array header, trim, no-XFF, and `unknown` fallback.                                                                                                            |
| Fixed 24h daily window `{start,count}`, O(1)/IP, `sweepDaily` at `MAX_TRACKED_IPS`                                      | ✅ Yes    | `rateLimit.ts:30,72-77,112-129`; rollover test uses `vi.setSystemTime(+24h)`.                                                                                                                                         |
| Two new module stores, `buckets` sweep untouched                                                                        | ✅ Yes    | `daily` Map and `globalStart/globalCount` live beside `buckets`; `sweep()` body unchanged.                                                                                                                            |
| Verdict order minute → daily → global, first block wins; blocked mutates nothing; accepted records all enabled counters | ✅ Yes    | `rateLimit.ts:96-163`; precedence tests (minute>daily, daily>global, global fallback) plus no-mutation-on-block tests for daily and global.                                                                           |
| `reason?` on `IRateLimitResult`, union `minute\|daily\|global`                                                          | ✅ Yes    | `rateLimit.ts:35-45`; allowed results carry no `reason`.                                                                                                                                                              |
| `readNonNegativeInt` kill valve (`0` disables); `readPositiveInt` semantics untouched                                   | ✅ Yes    | `rateLimit.ts:47-60`. Documented deviation (apply): empty-string env (`FOO=`) → default instead of `Number("")===0` silently disabling the cap — consistent with the design's "invalid → default" rule.               |
| Single `checkRateLimit(ip)` gate at unchanged pipeline position                                                         | ✅ Yes    | `chat.ts:94-95` — after 405/400 guards, before KB/provider; the diff shows the call site as unchanged context (only a log added inside the block).                                                                    |
| One `console.info` per HTTP 429 incl. `upstream`; no fourth log site                                                    | ✅ Yes    | Two log sites exist; `getProvider()` sync throw always carries status 503 (`provider.ts:157-166`), so its catch can never produce a 429; post-open in-band `rate_limit` events are not HTTP 429s (design: unchanged). |
| 429 body/message/`Retry-After` and ChatWidget untouched; zero new deps                                                  | ✅ Yes    | `git diff 8af0e02~1..30f4133`: 8 files (clientIp±test, rateLimit±test, chat±test, `.env.example`, `openspec/config.yaml`); no ChatWidget, no package manifests.                                                       |
| Env knobs in `.env.example`; vitest runner in `openspec/config.yaml`                                                    | ✅ Yes    | `AI_RATE_LIMIT_DAILY_MAX=60`, `AI_GLOBAL_RATE_LIMIT_MAX=120` with `0`-disables notes; `testing.runner: vitest`. One stale line remains (see WARNING).                                                                 |

### Issues Found

**CRITICAL**: None.

**WARNING**:

1. `openspec/config.yaml` `context:` block (line 7) still states "No test suite configured", contradicting the `testing:` block (`runner: vitest`, `command: "npm test"`) in the same file. Task 5.2 modified this file but its field list did not include `context:`; apply flagged it and left it untouched. Machine-adjacent config text, does not affect any gate run — but it can mislead a future phase that reads `context:` for capability detection. Recommend fixing during archive or as a trivial chore (reported, not fixed in this phase).

**SUGGESTION**:

1. Design's changed-line forecast (~370) undercounted test volume (actual ~614 changed lines, 597+/17−); within the authorized 800-line single-PR budget, but future forecasts should count test lines explicitly.
2. `chat.test.ts > … logs reason global…` asserts `reason: "global"` but not the exactly-once call count (the minute and daily tests do). The single shared `if (!rate.allowed)` log branch makes a second log structurally impossible; adding `toHaveBeenCalledTimes(1)` would mirror the other tests.
3. Design open questions remain unresolved and are human decisions: confirm the 60 RPD/IP default and `VERCEL` marker assumption; decide whether unsalted `ipHash` is acceptable or an optional `AI_LOG_IP_SALT` should be added (non-blocking).
4. The `readNonNegativeInt` empty-string handling is a documented implementation refinement over the design's literal `Number()`-based sketch; consider folding it into `design.md` at archive time so the docs match the code.

### Verdict

**PASS WITH WARNINGS** — all 11 spec scenarios have covering tests that passed at runtime (6/6 requirements, 11/11 scenarios), all three quality gates exit 0 on committed state, every design decision is followed (one documented refinement), ChatWidget and package manifests are untouched, and zero critical findings; the single warning is stale config text outside the spec/design contract.
