# Design: Harden Anonymous Chatbot Rate Limiting Against Abuse

## Technical Approach

Zero-new-deps hardening of the in-memory limiter (proposal approach 1, spec `chatbot-rate-limiting`): new `src/lib/ai/clientIp.ts` behind a `VERCEL` gate; `rateLimit.ts` gains a per-IP fixed 24h daily window and a module-global fixed 60s counter; `checkRateLimit(ip)` remains the single gate in `chat.ts` (pipeline order unchanged) and returns a `reason`. Each HTTP 429 → one structured `console.info`; body, message, `Retry-After`, ChatWidget unchanged.

## Architecture Decisions

| Decision           | Options (rejected)                                                                                                                       | Choice + rationale                                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| IP trust boundary  | always-leftmost-XFF (spoofable off-Vercel → bucket rotation); rightmost XFF (Vercel's edge); platform header (`x-real-ip`, undocumented) | **Leftmost XFF only when `process.env.VERCEL === "1"`, else `req.socket.remoteAddress`** — spoofing impossible off-Vercel; dev shares one bucket |
| Daily window shape | sliding 24h timestamp array (≤60 ts/IP, extra sweep profile); UTC calendar-day reset (midnight burst)                                    | **Fixed 24h window from first hit `{start,count}`** — O(1)/IP, trivial rollover; boundary burst ≤ 2× cap accepted                                |
| State placement    | overload `buckets` Map                                                                                                                   | **Two new module stores in `rateLimit.ts`** — a different value shape would fork the existing sweep:                                             |

```ts
const daily = new Map<string, { start: number; count: number }>();
let globalStart = 0; // fixed 60s window
let globalCount = 0;
```

`sweepDaily(now)` mirrors `sweep()` at `MAX_TRACKED_IPS` (drops `start + 86_400_000 <= now`, daily path only); `resetRateLimits()` clears all three stores.

**Verdict**: `IRateLimitResult` gains `reason?: "minute" | "daily" | "global"` (only when blocked) — preserves shape; a union return churns the call site, split checks leak ordering into the route. Order in `checkRateLimit`: **minute → daily → global**, first block wins; blocked requests mutate no counters; accepted ones record all enabled counters. Kill valves use new `readNonNegativeInt` (`>=0` floored, invalid → default); `readPositiveInt` semantics stay untouched.

| Knob                                 | Default        | `0`              | Unset/invalid |
| ------------------------------------ | -------------- | ---------------- | ------------- |
| `AI_RATE_LIMIT_MAX` (existing)       | 30/min/IP      | → 30 (unchanged) | 30            |
| `AI_RATE_LIMIT_WINDOW_MS` (existing) | 60000          | → 60000          | 60000         |
| `AI_RATE_LIMIT_DAILY_MAX`            | 60/day/IP      | **disables**     | 60            |
| `AI_GLOBAL_RATE_LIMIT_MAX`           | 120/min global | **disables**     | 120           |

**429 log** — one `console.info("[chat] rate limited:", {...})` per HTTP 429 (limiter + pre-stream upstream):

```ts
{
  reason: "minute" | "daily" | "global" | "upstream",
    ipHash, // sha256(ip) → first 16 hex chars (node:crypto)
    retryAfter;
} // seconds; daily ≤ 86400, global ≤ 60, upstream 30
```

`hashIp` lives in `clientIp.ts`, unsalted for cross-instance correlation; raw IPs/message text never logged (salt deferred). Post-open in-band `rate_limit` events aren't HTTP 429s → unchanged.

## Data Flow

    POST /api/chat → 405/400 guards (unchanged)
      → getClientIp: VERCEL=1 → leftmost XFF | else → socket.remoteAddress ?? "unknown"
      → checkRateLimit(ip): 1 minute → "minute" | 2 daily → "daily" | 3 global → "global"
      → block: ONE structured log + 429 {error:"rate_limit", message, retryAfter} + Retry-After
      → provider: pre-stream upstream 429 → log "upstream" + same 429 contract

## Interfaces / Contracts

```ts
// src/lib/ai/clientIp.ts (new)
export function getClientIp(req: NextApiRequest): string;
export function hashIp(ip: string): string;
```

Trimmed first non-empty entry; `VERCEL !== "1"` or header absent → `req.socket.remoteAddress || "unknown"`.

## File Changes

| File                           | Action | Δ lines  |
| ------------------------------ | ------ | -------- |
| `src/lib/ai/clientIp.ts`       | Create | +40      |
| `src/lib/ai/clientIp.test.ts`  | Create | +85      |
| `src/lib/ai/rateLimit.ts`      | Modify | +65      |
| `src/lib/ai/rateLimit.test.ts` | Create | +110     |
| `src/pages/api/chat.ts`        | Modify | +20 / −6 |
| `src/pages/api/chat.test.ts`   | Modify | +40      |
| `.env.example`                 | Modify | +7       |

≈370 changed lines — within the 300–380 forecast, single PR under the 800-line budget.

## Testing Strategy

| File                | Cases                                                                                                                                                                                                                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clientIp.test.ts`  | forged XFF off-Vercel → socket; `VERCEL=1` → leftmost of `203.0.113.9, 10.0.0.1`; array header; `VERCEL=1` without XFF → socket; `hashIp` = 16 hex, stable, never raw                                                                                                                                                             |
| `rateLimit.test.ts` | minute block + `retryAfter≥1`; daily 61st → `daily` `≤86400`; rollover via `vi.setSystemTime` +24h; global 3rd arrival → `global` `≤60` across IPs; both `0` valves unlimited; custom values; precedence minute > daily > global; `resetRateLimits` clears all three                                                              |
| `chat.test.ts`      | **set `VERCEL=1` in `beforeAll`/restore `afterAll`** — else XFF tests collapse onto `127.0.0.1`; limiter 429 → exactly one `console.info` with `reason` + `ipHash`, raw IP absent; upstream 429 → `reason:"upstream"`; spoofed XFF with `VERCEL` unset → 429; contract `{error:"rate_limit"}` + `Retry-After` on daily/global 429 |

Gates: `npm test`, `npm run lint`, `tsc --noEmit` — zero new dependencies.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration. Add two knobs to `.env.example`; defaults active on deploy; emergency kill: `AI_RATE_LIMIT_DAILY_MAX=0` + `AI_GLOBAL_RATE_LIMIT_MAX=0`. Stack on `feature/chatbot-guardrails`; Phase-2 Upstash if logs show per-instance bypass.

## Open Questions

- [ ] Confirm 60 RPD/IP default and `VERCEL` marker assumption (proposal: needs human input)
- [ ] Unsalted `ipHash` acceptable, or add optional `AI_LOG_IP_SALT`?
