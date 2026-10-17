# Exploration: Anonymous-user anti-abuse / rate limiting for the chatbot

Change: `avoid-malicious-rate-limiting-anonymous-chatbot` — protect the chatbot against abusive anonymous traffic (flooding, rate-limit bypass, cost exhaustion).

## Current State

### Chatbot architecture (all anonymous, no auth layer)

| Layer      | File                                            | Role                                                                                                                                              |
| ---------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page       | `src/pages/index.tsx:15-38`                     | Mounts `ChatWidget` via `next/dynamic` (`ssr: false`) behind `NEXT_PUBLIC_AI_CHAT_ENABLED === "true"`                                             |
| Client     | `src/components/Molecules/ChatWidget/index.tsx` | SSE fetch to `/api/chat`, 50 ms delta coalescing, last-8-message history, `RESEND_GUARD_MS = 300` and `busy` gate, bilingual labels, retry banner |
| API        | `src/pages/api/chat.ts` (250 lines)             | Pages Router SSE endpoint: validate → rate-limit → KB/prompt → stream → buffer-validate-emit                                                      |
| Rate limit | `src/lib/ai/rateLimit.ts`                       | In-memory per-IP sliding window (default 30 req/60 s), env-tunable                                                                                |
| Guardrails | `src/lib/ai/guardrails.ts`                      | Output-side `validateResponse()` heuristics (JSON/XML/HTML framing, role claims, instruction disclosure, oversize)                                |
| Prompt     | `src/lib/ai/prompt.ts`                          | Immutable-role `INSTRUCTIONS` (rules 1–12), `trimHistory()` (8 msgs / 1500 tokens), ES/EN canned + guardrail replies                              |
| Provider   | `src/lib/ai/provider.ts`                        | Zero-dep OpenAI-compatible fetch streaming; `groq` (default free tier) / `cerebras` / `openai`; 700 max completion tokens                         |
| Knowledge  | `src/lib/ai/knowledge.ts`                       | Markdown KB, keyword-ranked sections under `AI_MAX_KB_TOKENS` (5000)                                                                              |

- **Identity/session**: there is NONE. Every user is anonymous. The conversation lives only in React state; the client ships the last 8 messages as untrusted `history` on every POST. The only persisted client datum is the UI language (`chat-lang:v1` in localStorage).
- **Auth layer**: none (no next-auth, no cookies, no middleware/proxy file — no `middleware.ts`/`proxy.ts` exists).
- **Request path**: `ChatWidget.send()` → `POST /api/chat {message, history, language}` → 405 (non-POST) → 400 `empty_message`/`message_too_long` (max 2000 chars) → 429 `rate_limit` (per-IP limiter, `Retry-After` header) → 503 `knowledge_unavailable` → provider stream → pull first delta (upstream 429→local 429 + `Retry-After: 30`, 5xx→503) → `writeHead(200, text/event-stream)` → buffer ALL deltas → `validateResponse()` → emit `delta` events (or bilingual guardrail fallback) + `done`; mid-stream failures become in-band `{type:"error"}` events; client abort → provider `AbortController` → 499.

### Existing anti-abuse protections

1. **Per-IP sliding-window limiter** (`src/lib/ai/rateLimit.ts:40-71`): `Map<string, number[]>` of timestamps; default `AI_RATE_LIMIT_MAX=30` per `AI_RATE_LIMIT_WINDOW_MS=60000` (Groq free-tier RPM); `retryAfter` computed from oldest stamp; sweep caps the map at 5000 IPs. Tested in `src/pages/api/chat.test.ts:312` ("returns 429 for an IP over the rate limit").
2. **Input caps**: message ≤ 2000 chars (chat.ts:20, 92-98); history shape-normalized + trimmed to 8 msgs / 1500 tokens (`trimHistory`, prompt.ts:75-98) — bounds token amplification via forged history.
3. **Completion cap**: 700 tokens (`MAX_COMPLETION_TOKENS`, chat.ts:21).
4. **Output guardrails** (`validateResponse`, guardrails.ts:188-217): content policy only — no volume/abuse control.
5. **Client-side only**: 300 ms resend guard, single in-flight request per widget. Trivially bypassed with raw `fetch` — not a security control.
6. **Error surface**: pre-stream JSON statuses (405/400/429/503) with `Retry-After` on 429; in-stream `error` events (`rate_limit`/`provider`/`invalid`); client shows bilingual retry banner (`labels.ts`).

### What does NOT exist

- No Redis/Upstash (or any DB) in `package.json`; limiter state is in-process only (per comment in rateLimit.ts:6-7: resets on redeploy, per-instance on serverless).
- No captcha / Turnstile / hCaptcha, no proof-of-work, no device fingerprinting.
- No middleware/edge layer, no per-IP daily cap, no global concurrency cap, no token-cost weighting, no IP reputation, no 429-volume metrics/alerting (only `console.error` on guardrails/provider failures).
- No authenticated or trusted-user bypass path.

## Affected Areas

- `src/pages/api/chat.ts` — `getClientIp()` (lines 36-41) and the rate-limit gate (lines 100-110) are the injection point for any new control.
- `src/lib/ai/rateLimit.ts` — algorithm/store replacement or extension (daily windows, global caps, durable store).
- `src/pages/api/chat.test.ts` — existing 429 tests; new behavior needs unit coverage (vitest available, `npm test`).
- `.env.example` — new knobs (e.g. daily cap, store credentials) if introduced.
- `src/components/Molecules/ChatWidget/*` — ideally untouched; 429 handling + `Retry-After` already render correctly (could later add auto-backoff using `retryAfter`).
- Preserve: guardrails buffer-then-validate flow, first-delta error mapping, abort handling, SSE event contract.

## Key gaps / abuse vectors (ranked)

1. **Client-IP spoofing → limiter bypass.** `getClientIp()` trusts the **leftmost** `x-forwarded-for` entry (chat.ts:36-41). On Vercel the platform overwrites this header, so spoofing is blocked in production; on any self-hosted/Node deployment an attacker can rotate a fake IP per request and completely bypass the per-IP limiter. No tests cover `getClientIp`.
2. **In-memory, per-instance state.** On serverless the effective global limit multiplies by instance count; cold starts and redeploys zero all windows. Two rapid bursts from the same IP can hit different instances and each get 30 RPM.
3. **No per-IP daily budget.** 30 RPM is tuned to Groq's RPM but Groq free tier also caps 1K RPD — a single abusive IP can exhaust the entire site's daily quota in ~33 minutes of max-rate use, denial-of-service-ing every other visitor (the provider then 429s everyone, mapped to the user-facing "rate limit" message).
4. **No cost weighting.** Every accepted request costs up to ~2000-char input + 5000-token KB + 700-token completion, regardless of content; request-count-only limiting leaves the expensive tail unbounded in aggregate.
5. **No second line of defense.** No captcha/verification step for offending IPs; a botnet across many IPs is structurally unlimited beyond provider tier caps.
6. **No observability.** Rate-limit hits are not counted/logged — abuse is invisible until users complain.

## Approaches

1. **Harden in-process limiter (zero new deps)** — correct client-IP resolution (platform-aware `x-real-ip` / platform-set `x-forwarded-for`, extracted + unit-tested), add per-IP daily cap and a global in-process concurrency/arrival cap, optional simple cost weighting; log 429 counters.
   - Pros: no new dependencies or env; fits Pages Router; unit-testable; addresses vectors 1, 3, 4, 6 partially.
   - Cons: still per-instance on serverless (vector 2 remains); memory grows with distinct IPs (bounded by existing sweep).
   - Effort: Low-Medium.
2. **Durable distributed limiter (Upstash Redis + `@upstash/ratelimit`)** — sliding window + daily quota shared across instances; same 429 contract.
   - Pros: fixes vector 2; battle-tested algorithm; free tier adequate for a portfolio.
   - Cons: new dependency + two env vars + network hop per request (latency on hot path); vendor account; local-dev needs mock or fallback.
   - Effort: Medium.
3. **Tiered: approach 1 + verification challenge** — after N violations in a window, require a Turnstile/hCaptcha interstitial (or token) before the next LLM call.
   - Pros: stops distributed abuse where counting cannot; standard UX pattern.
   - Cons: UX friction on a portfolio site; new dependency + keys; captcha accessibility concerns.
   - Effort: Medium-High.

## Recommendation

Proposal should start from **Approach 1** (mandatory hardening: trustworthy client IP, per-IP daily cap, global cap, observability — cheap and closes the highest-severity vectors), with **Approach 2** as the escalation if the site is confirmed to run on serverless multi-instance (Vercel is strongly implied by `@vercel/speed-insights` and no `vercel.json`; no self-host config found). Defer Approach 3 unless approach 1+2 metrics show distributed abuse. Note: the change name is ambiguous between "stop malicious users from abusing the chatbot" and "stop the rate limiter from unfairly punishing anonymous (possibly shared-NAT) users" — the codebase evidence (free-tier provider, public anonymous endpoint) supports the anti-abuse reading, but shared-IP fairness (e.g. corporate NATs sharing one IP against a 30 RPM budget) is a real secondary concern the proposal should address explicitly.

## Open Questions

1. **Threat model confirmation**: primary goal is abuse/cost protection, or also fairness for shared-NAT IPs (multiple legit visitors behind one IP)?
2. **Deployment target**: Vercel serverless vs long-lived Node? Decides whether in-memory (approach 1) is sufficient or a durable store (approach 2) is required.
3. **Budget for new dependencies/vendors**: is Upstash (free tier) acceptable? Is Turnstile acceptable UX-wise?
4. **Limits**: desired RPM, per-IP RPD, and global concurrency? (Current: 30 RPM, no daily.)
5. **Provider fallback behavior**: keep mapping upstream Groq 429s to the same client-facing `rate_limit` message, or differentiate "site busy" from "you are throttled"?
6. **Branch strategy**: the entire chatbot (endpoint, limiter, guardrails) exists only on the unmerged `feature/chatbot-guardrails` branch (main/develop contain no `src/lib/ai` or `api/chat`); this change must stack on that branch or wait for its merge.

## Risks

- Over-tight limits degrade the portfolio's flagship interactive feature; under-tight limits let one IP drain the Groq daily quota (denial of service for all visitors).
- Serverless per-instance state silently multiplies any in-memory limit.
- Trusting the wrong `x-forwarded-for` position either enables spoofing (leftmost on self-hosted) or, if hardened incorrectly for Vercel, could collapse all visitors behind the proxy into one bucket.
- Adding Redis adds a per-request network dependency to the hot path; outage handling (fail-open vs fail-closed) must be decided.
- `feature/chatbot-guardrails` has uncommitted working-tree changes; this change's base is moving.

## Ready for Proposal

Yes — clear single injection point (`chat.ts` rate gate + `rateLimit.ts`), existing env/flag patterns, existing 429 contract on both HTTP and SSE layers, and vitest coverage in place. The proposal must resolve open questions Q1–Q6 (threat model, deployment target, dependency budget, limit values, 429 message semantics, branch base).
