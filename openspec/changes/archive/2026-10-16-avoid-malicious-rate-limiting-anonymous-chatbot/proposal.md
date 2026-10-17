# Proposal: Harden anonymous chatbot rate limiting against abuse

## Intent

One abusive anonymous IP can bypass or exhaust current protections and DoS every other visitor: `getClientIp()` trusts the spoofable leftmost `x-forwarded-for` (`chat.ts:36-41`), limiter state is in-memory/per-instance, and there is no per-IP daily cap — 30 RPM for ~33 min drains Groq's 1K RPD free tier for the whole site. Harden the existing limiter so no single IP or burst can drain the provider quota or evade throttling.

## Scope

### In Scope

- Trustworthy, unit-tested client-IP resolution (new `src/lib/ai/clientIp.ts`)
- Per-IP daily cap (default 60/day, `AI_RATE_LIMIT_DAILY_MAX`; `0` disables)
- Global in-process arrival cap (default 120/min, `AI_GLOBAL_RATE_LIMIT_MAX`; `0` disables) → 429 + `Retry-After`
- Structured 429 logging (reason, hashed IP) for abuse visibility
- `.env.example` knobs; vitest coverage for IP resolution, daily cap, global cap

### Out of Scope

- Durable/distributed store (Upstash `@upstash/ratelimit`) — Phase 2 if multi-instance bypass is observed (keeps zero-new-deps)
- Captcha/Turnstile, cost/token weighting, IP reputation, auth/session identity
- ChatWidget changes — 429 contract and single client-facing message stay as-is

## Capabilities

### New Capabilities

- `chatbot-rate-limiting`: client-IP trust rules, per-IP RPM + RPD limits, global cap, 429 contract, observability

### Modified Capabilities

- None — `chatbot-guardrails`' "429 returned as today" requirement remains satisfied (HTTP contract unchanged)

## Approach

Approach 1 from exploration (zero-new-deps hardening of `rateLimit.ts`):

1. **IP resolution**: extract `getClientIp` → `clientIp.ts`. Trust `x-forwarded-for` first entry ONLY when `VERCEL=1` (platform rewrites the header); otherwise ignore client headers and use `req.socket.remoteAddress`.
2. **Limiter**: keep the sliding-window algorithm; add a second per-IP daily window plus a module-global arrival counter. Preserve `IRateLimitResult` shape and `resetRateLimits()`.
3. **Gate** at `chat.ts:100-110`: same call site, richer verdict (`minute` | `daily` | `global`); 429 body keeps `error: "rate_limit"` + `Retry-After`; reasons go to logs only (no client change).
4. One structured `console.info` per 429 and on upstream-429 mapping.

### Assumptions (automatic mode — correct if wrong)

- Q1: abuse/cost protection is primary; 30 RPM / 60 RPD per IP is generous vs any real visitor behind a shared NAT.
- Q2/Q3: Vercel serverless; zero new dependencies this change — Upstash is the Phase-2 decision point if logs show per-instance bypass.
- Q4 defaults: 30 RPM (existing), 60 RPD/IP, 120 global arrivals/min — all env-tunable.
- Q5: one client-facing 429 message; cause differentiation via server logs only.
- Q6 base: stack on `feature/chatbot-guardrails` (all chatbot code lives there, with uncommitted changes).

### Needs human input before apply

- Confirm limit defaults (esp. 60 RPD/IP) and the Vercel assumption; pre-approve Phase-2 Upstash budget if multi-instance risk matters to you.

## Affected Areas

| Area                         | Impact   | Description                                        |
| ---------------------------- | -------- | -------------------------------------------------- |
| `src/lib/ai/clientIp.ts`     | New      | Testable, platform-aware IP resolution (~40 lines) |
| `src/lib/ai/rateLimit.ts`    | Modified | Daily window + global counter (~+90 lines)         |
| `src/pages/api/chat.ts`      | Modified | Use `clientIp`, gate verdict, 429 logging          |
| `src/pages/api/chat.test.ts` | Modified | New unit coverage                                  |
| `.env.example`               | Modified | New knobs                                          |

## Risks

| Risk                                                              | Likelihood | Mitigation                                                                               |
| ----------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| Per-instance state still multiplies limits on serverless          | Med        | Daily + global caps bound worst case per instance; Phase-2 Upstash escalation documented |
| Wrong IP-trust rule collapses all Vercel visitors into one bucket | Low        | `VERCEL` env gate + unit tests for both paths                                            |
| Over-tight limits annoy real visitors                             | Low        | Defaults far above realistic usage; env kill valves (`0`)                                |
| Base branch unmerged with uncommitted changes                     | High       | Stack on `feature/chatbot-guardrails`; prerequisite: freeze/merge it first               |

## Rollback Plan

- `AI_RATE_LIMIT_DAILY_MAX=0` + `AI_GLOBAL_RATE_LIMIT_MAX=0` disables the new caps without a code revert.
- Full revert: `git revert` the PR (limiter returns to RPM-only).
- Kill switch: `NEXT_PUBLIC_AI_CHAT_ENABLED=false` hides the widget entirely.

## Dependencies

- `feature/chatbot-guardrails` branch (merge or stack-first)
- Vitest (existing devDependency); no new packages

## Success Criteria

- [ ] Spoofed `x-forwarded-for` ignored off-Vercel (unit test)
- [ ] 61st request from one IP in a day → 429 with correct `Retry-After` (unit test)
- [ ] Global-cap breach → 429 (unit test); both caps disable via env `0`
- [ ] Every 429 emits one structured log with reason
- [ ] `npm test`, `npm run lint`, `tsc --noEmit` green

## Size Estimate

~300–380 changed lines (new file + tests dominate) — fits a single PR under the 800-line review budget; no chaining forecast.
