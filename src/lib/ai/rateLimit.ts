/**
 * In-memory rate limiter (T-03, hardened by chatbot-rate-limiting R2/R3).
 *
 * Three independent verdicts, evaluated in order (first block wins):
 *
 * 1. Per-IP sliding minute window — `AI_RATE_LIMIT_MAX` requests per
 *    `AI_RATE_LIMIT_WINDOW_MS` (defaults: 30 RPM — the Groq free tier).
 * 2. Per-IP fixed 24h window — `AI_RATE_LIMIT_DAILY_MAX` (default: 60 RPD).
 *    `0` disables the cap; `readNonNegativeInt` is what makes that kill
 *    valve expressible (`readPositiveInt` maps 0 → default).
 * 3. Module-global fixed 60s arrival counter — `AI_GLOBAL_RATE_LIMIT_MAX`
 *    (default: 120/min across all IPs). `0` disables it.
 *
 * State lives in-process: it resets on redeploy and is per-instance on
 * serverless (documented in design decision #6); the daily and global caps
 * bound the worst case per instance.
 */

const DEFAULT_MAX = 30;
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_DAILY_MAX = 60;
const DEFAULT_GLOBAL_MAX = 120;
const DAILY_WINDOW_MS = 86_400_000;
const GLOBAL_WINDOW_MS = 60_000;
/** Safety valve so idle IPs never grow the map unbounded. */
const MAX_TRACKED_IPS = 5_000;

const buckets = new Map<string, number[]>();
/** Fixed 24h window per IP: `{ start, count }` — deliberately NOT in `buckets` (different value shape would fork `sweep`). */
const daily = new Map<string, { start: number; count: number }>();
/** Fixed 60s module-global arrival counter. */
let globalStart = 0;
let globalCount = 0;

export type IRateLimitReason = "minute" | "daily" | "global";

export interface IRateLimitResult {
  allowed: boolean;
  /** Seconds until the oldest request leaves the window (0 when allowed). */
  retryAfter: number;
  /** Requests still available in the current window. */
  remaining: number;
  /** Why the request was blocked (present only when `allowed` is false). */
  reason?: IRateLimitReason;
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

/** Like `readPositiveInt`, but `0` is a valid value — the kill valve for the new caps. */
function readNonNegativeInt(
  value: string | undefined,
  fallback: number
): number {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

function sweep(now: number, windowMs: number): void {
  if (buckets.size <= MAX_TRACKED_IPS) return;
  buckets.forEach((stamps, ip) => {
    const fresh = stamps.filter((stamp) => stamp + windowMs > now);
    if (fresh.length === 0) buckets.delete(ip);
    else buckets.set(ip, fresh);
  });
}

/** Mirrors `sweep` for the daily store: drops windows that already rolled over. */
function sweepDaily(now: number): void {
  if (daily.size <= MAX_TRACKED_IPS) return;
  daily.forEach((entry, ip) => {
    if (entry.start + DAILY_WINDOW_MS <= now) daily.delete(ip);
  });
}

/** Record one request for `ip`; returns whether it is allowed. */
export function checkRateLimit(ip: string): IRateLimitResult {
  const max = readPositiveInt(process.env.AI_RATE_LIMIT_MAX, DEFAULT_MAX);
  const windowMs = readPositiveInt(
    process.env.AI_RATE_LIMIT_WINDOW_MS,
    DEFAULT_WINDOW_MS
  );
  const dailyMax = readNonNegativeInt(
    process.env.AI_RATE_LIMIT_DAILY_MAX,
    DEFAULT_DAILY_MAX
  );
  const globalMax = readNonNegativeInt(
    process.env.AI_GLOBAL_RATE_LIMIT_MAX,
    DEFAULT_GLOBAL_MAX
  );
  const now = Date.now();

  // 1 — per-IP sliding minute window (pre-existing verdict).
  const timestamps = (buckets.get(ip) ?? []).filter(
    (stamp) => stamp + windowMs > now
  );
  if (timestamps.length >= max) {
    buckets.set(ip, timestamps);
    sweep(now, windowMs);
    const oldest = timestamps[0];
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
      remaining: 0,
      reason: "minute",
    };
  }

  // 2 — per-IP fixed 24h window; an expired entry means a fresh window.
  const dailyEntry = daily.get(ip);
  const dailyFresh =
    dailyEntry && dailyEntry.start + DAILY_WINDOW_MS > now
      ? dailyEntry
      : undefined;
  if (dailyMax > 0 && dailyFresh && dailyFresh.count >= dailyMax) {
    sweepDaily(now);
    return {
      allowed: false,
      retryAfter: Math.max(
        1,
        Math.ceil((dailyFresh.start + DAILY_WINDOW_MS - now) / 1000)
      ),
      remaining: 0,
      reason: "daily",
    };
  }

  // 3 — module-global fixed 60s arrival counter.
  const globalFresh = globalStart + GLOBAL_WINDOW_MS > now;
  if (globalMax > 0 && globalFresh && globalCount >= globalMax) {
    return {
      allowed: false,
      retryAfter: Math.max(
        1,
        Math.ceil((globalStart + GLOBAL_WINDOW_MS - now) / 1000)
      ),
      remaining: 0,
      reason: "global",
    };
  }

  // Allowed — blocked requests mutate nothing; accepted ones record every
  // enabled counter.
  timestamps.push(now);
  buckets.set(ip, timestamps);
  sweep(now, windowMs);

  if (dailyMax > 0) {
    if (dailyFresh) dailyFresh.count += 1;
    else daily.set(ip, { start: now, count: 1 });
    sweepDaily(now);
  }

  if (globalMax > 0) {
    if (!globalFresh) {
      globalStart = now;
      globalCount = 0;
    }
    globalCount += 1;
  }

  return {
    allowed: true,
    retryAfter: 0,
    remaining: Math.max(0, max - timestamps.length),
  };
}

/** Test/dev helper: drop all three stores. */
export function resetRateLimits(): void {
  buckets.clear();
  daily.clear();
  globalStart = 0;
  globalCount = 0;
}
