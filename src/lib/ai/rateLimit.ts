/**
 * In-memory sliding-window rate limiter (T-03).
 *
 * Per-IP, fixed window with `AI_RATE_LIMIT_MAX` requests per
 * `AI_RATE_LIMIT_WINDOW_MS` (defaults: 30 RPM — the Groq free tier).
 * State lives in-process: it resets on redeploy and is per-instance on
 * serverless (documented in design decision #6).
 */

const DEFAULT_MAX = 30;
const DEFAULT_WINDOW_MS = 60_000;
/** Safety valve so idle IPs never grow the map unbounded. */
const MAX_TRACKED_IPS = 5_000;

const buckets = new Map<string, number[]>();

export interface IRateLimitResult {
  allowed: boolean;
  /** Seconds until the oldest request leaves the window (0 when allowed). */
  retryAfter: number;
  /** Requests still available in the current window. */
  remaining: number;
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function sweep(now: number, windowMs: number): void {
  if (buckets.size <= MAX_TRACKED_IPS) return;
  buckets.forEach((stamps, ip) => {
    const fresh = stamps.filter((stamp) => stamp + windowMs > now);
    if (fresh.length === 0) buckets.delete(ip);
    else buckets.set(ip, fresh);
  });
}

/** Record one request for `ip`; returns whether it is allowed. */
export function checkRateLimit(ip: string): IRateLimitResult {
  const max = readPositiveInt(process.env.AI_RATE_LIMIT_MAX, DEFAULT_MAX);
  const windowMs = readPositiveInt(
    process.env.AI_RATE_LIMIT_WINDOW_MS,
    DEFAULT_WINDOW_MS
  );
  const now = Date.now();

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
    };
  }

  timestamps.push(now);
  buckets.set(ip, timestamps);
  sweep(now, windowMs);
  return {
    allowed: true,
    retryAfter: 0,
    remaining: Math.max(0, max - timestamps.length),
  };
}

/** Test/dev helper: drop all windows. */
export function resetRateLimits(): void {
  buckets.clear();
}
