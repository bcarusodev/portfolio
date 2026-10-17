# Delta for chatbot-rate-limiting

## ADDED Requirements

### Requirement: Trustworthy Client IP Resolution

Client IP MUST be resolved by a dedicated resolver: the leftmost `x-forwarded-for` entry is trusted ONLY when the `VERCEL` env marker is set; otherwise client-supplied headers MUST be ignored and `req.socket.remoteAddress` used.

#### Scenario: XFF spoofing off-Vercel ignored

- GIVEN a request without the `VERCEL` marker carrying a forged `x-forwarded-for`
- WHEN the resolver runs
- THEN the socket remote address is used; the forged IP never reaches the limiter

#### Scenario: VERCEL env present

- GIVEN `VERCEL=1` and `x-forwarded-for: 203.0.113.9, 10.0.0.1`
- WHEN the resolver runs
- THEN the leftmost entry becomes the client IP

### Requirement: Per-IP RPM and Daily Caps

The limiter MUST keep the existing 30 RPM sliding window and add a per-IP daily cap (default 60, `AI_RATE_LIMIT_DAILY_MAX`, env-tunable). Over-cap requests MUST return 429 with `Retry-After`.

#### Scenario: 61st request in a day rejected

- GIVEN one IP at 60 requests today
- WHEN a 61st request arrives
- THEN 429 is returned with `Retry-After`

#### Scenario: Daily window rollover

- GIVEN an IP blocked at its daily cap
- WHEN the daily window rolls over
- THEN requests are accepted under a fresh counter

#### Scenario: Kill valve and env-tunable value

- GIVEN `AI_RATE_LIMIT_DAILY_MAX=0` (or a custom value)
- WHEN requests arrive from one IP
- THEN the daily cap is disabled (or applied at that value)

### Requirement: Global Arrival Cap

The limiter MUST enforce a global in-process arrival cap (default 120/min, `AI_GLOBAL_RATE_LIMIT_MAX`, env-tunable); arrivals over the cap MUST return 429 with `Retry-After` regardless of source IP.

#### Scenario: Global cap exceeded

- GIVEN the global counter at the cap for the current minute
- WHEN another request arrives from any IP
- THEN 429 is returned and the log records reason `global`

#### Scenario: Kill valve and env-tunable value

- GIVEN `AI_GLOBAL_RATE_LIMIT_MAX=0` (or a custom value)
- WHEN requests arrive
- THEN the cap is disabled (or applied at that value)

### Requirement: 429 Client Contract Preservation

Every limiter or mapped-upstream 429 MUST keep the existing contract: `error: "rate_limit"` body, `Retry-After` header, single ChatWidget-facing message; cause MUST be differentiated via server logs only.

#### Scenario: Contract preserved on limiter 429

- GIVEN a per-IP or global 429
- WHEN the response returns
- THEN body, `Retry-After`, and widget text are unchanged

#### Scenario: Upstream Groq 429 mapping

- GIVEN Groq returns 429 before the first delta
- WHEN the response is mapped
- THEN the client contract holds and a log records reason `upstream`

### Requirement: Structured 429 Logging

Every 429 MUST emit exactly one structured log carrying `reason` (`minute` | `daily` | `global` | `upstream`) and a hashed IP; raw IPs MUST NOT be logged.

#### Scenario: One log per rejection

- GIVEN a request rejected by any verdict
- WHEN the 429 is produced
- THEN one `console.info` carries reason and hashed IP

### Requirement: Tests and Quality Gates

Vitest unit tests MUST cover IP resolution (both trust paths), daily cap, global cap, and kill valves; `npm test`, `npm run lint`, `tsc --noEmit` MUST pass; no new dependencies.

#### Scenario: Quality gates green

- GIVEN the implemented change
- WHEN the three commands run
- THEN all exit clean with zero new packages

## Non-Goals

- Deferred: Upstash durable store, captcha/Turnstile, cost/token weighting, shared-NAT fairness.
- Accepted: in-memory state multiplies limits per serverless instance, bounded by daily and global caps.
