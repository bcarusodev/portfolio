import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, resetRateLimits } from "@/lib/ai/rateLimit";

/**
 * Spec R2 (daily cap), R3 (global cap), R5 (verdict order), R6 (gates).
 * Fake timers pin `Date.now()` so the fixed 24h/60s windows are exact.
 */

const DAILY_WINDOW_MS = 86_400_000;
const ENV_KEYS = [
  "AI_RATE_LIMIT_MAX",
  "AI_RATE_LIMIT_WINDOW_MS",
  "AI_RATE_LIMIT_DAILY_MAX",
  "AI_GLOBAL_RATE_LIMIT_MAX",
] as const;

let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = {};
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  resetRateLimits();
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = savedEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  resetRateLimits();
  vi.useRealTimers();
});

describe("checkRateLimit — per-IP minute window", () => {
  it("blocks at the minute cap with reason minute and a usable Retry-After", () => {
    process.env.AI_RATE_LIMIT_MAX = "2";

    expect(checkRateLimit("198.51.100.50").allowed).toBe(true);
    expect(checkRateLimit("198.51.100.50").reason).toBeUndefined();

    const blocked = checkRateLimit("198.51.100.50");
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe("minute");
    expect(blocked.retryAfter).toBeGreaterThanOrEqual(1);
    expect(blocked.remaining).toBe(0);
  });
});

describe("checkRateLimit — per-IP daily cap (R2)", () => {
  it("blocks the 61st request of the day with Retry-After within 86400s", () => {
    process.env.AI_RATE_LIMIT_MAX = "1000";
    process.env.AI_RATE_LIMIT_DAILY_MAX = "60";

    for (let i = 0; i < 60; i++) {
      expect(checkRateLimit("198.51.100.10").allowed).toBe(true);
    }

    const blocked = checkRateLimit("198.51.100.10");
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe("daily");
    expect(blocked.retryAfter).toBeGreaterThanOrEqual(1);
    expect(blocked.retryAfter).toBeLessThanOrEqual(86_400);
  });

  it("starts a fresh counter after the fixed 24h window rolls over", () => {
    process.env.AI_RATE_LIMIT_MAX = "1000";
    process.env.AI_RATE_LIMIT_DAILY_MAX = "60";

    for (let i = 0; i < 60; i++) checkRateLimit("198.51.100.11");
    expect(checkRateLimit("198.51.100.11").allowed).toBe(false);

    vi.setSystemTime(Date.now() + DAILY_WINDOW_MS);
    expect(checkRateLimit("198.51.100.11").allowed).toBe(true);
  });

  it("disables the daily cap when AI_RATE_LIMIT_DAILY_MAX=0", () => {
    process.env.AI_RATE_LIMIT_MAX = "1000";
    process.env.AI_RATE_LIMIT_DAILY_MAX = "0";

    for (let i = 0; i < 61; i++) {
      expect(checkRateLimit("198.51.100.12").allowed).toBe(true);
    }
  });

  it("applies a custom AI_RATE_LIMIT_DAILY_MAX value", () => {
    process.env.AI_RATE_LIMIT_MAX = "1000";
    process.env.AI_RATE_LIMIT_DAILY_MAX = "2";

    expect(checkRateLimit("198.51.100.13").allowed).toBe(true);
    expect(checkRateLimit("198.51.100.13").allowed).toBe(true);
    expect(checkRateLimit("198.51.100.13").reason).toBe("daily");
  });

  it("falls back to the default cap when the env value is invalid or empty", () => {
    process.env.AI_RATE_LIMIT_MAX = "1000";
    process.env.AI_RATE_LIMIT_DAILY_MAX = "not-a-number";
    process.env.AI_GLOBAL_RATE_LIMIT_MAX = "";

    for (let i = 0; i < 60; i++) checkRateLimit("198.51.100.14");
    // Default daily cap (60) applies even though the env value was garbage.
    expect(checkRateLimit("198.51.100.14").reason).toBe("daily");
  });
});

describe("checkRateLimit — global arrival cap (R3)", () => {
  it("blocks the 3rd arrival in the window from any IP with Retry-After ≤ 60s", () => {
    process.env.AI_GLOBAL_RATE_LIMIT_MAX = "2";

    expect(checkRateLimit("203.0.113.1").allowed).toBe(true);
    expect(checkRateLimit("203.0.113.2").allowed).toBe(true);

    const blocked = checkRateLimit("203.0.113.3");
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toBe("global");
    expect(blocked.retryAfter).toBeGreaterThanOrEqual(1);
    expect(blocked.retryAfter).toBeLessThanOrEqual(60);
  });

  it("resets the global window after 60s", () => {
    process.env.AI_GLOBAL_RATE_LIMIT_MAX = "1";

    expect(checkRateLimit("203.0.113.4").allowed).toBe(true);
    expect(checkRateLimit("203.0.113.5").reason).toBe("global");

    vi.setSystemTime(Date.now() + 60_000);
    expect(checkRateLimit("203.0.113.6").allowed).toBe(true);
  });

  it("disables the global cap when AI_GLOBAL_RATE_LIMIT_MAX=0", () => {
    process.env.AI_GLOBAL_RATE_LIMIT_MAX = "0";

    for (let i = 1; i <= 200; i++) {
      expect(checkRateLimit(`198.51.100.${i}`).allowed).toBe(true);
    }
  });

  it("applies a custom AI_GLOBAL_RATE_LIMIT_MAX value", () => {
    process.env.AI_GLOBAL_RATE_LIMIT_MAX = "3";

    expect(checkRateLimit("203.0.113.7").allowed).toBe(true);
    expect(checkRateLimit("203.0.113.8").allowed).toBe(true);
    expect(checkRateLimit("203.0.113.9").allowed).toBe(true);
    expect(checkRateLimit("203.0.113.10").reason).toBe("global");
  });
});

describe("checkRateLimit — verdict precedence (R5)", () => {
  it("blocks with minute before daily", () => {
    process.env.AI_RATE_LIMIT_MAX = "1";
    process.env.AI_RATE_LIMIT_DAILY_MAX = "1";
    process.env.AI_GLOBAL_RATE_LIMIT_MAX = "5";

    expect(checkRateLimit("198.51.100.40").allowed).toBe(true);
    expect(checkRateLimit("198.51.100.40").reason).toBe("minute");
  });

  it("blocks with daily before global", () => {
    process.env.AI_RATE_LIMIT_MAX = "10";
    process.env.AI_RATE_LIMIT_DAILY_MAX = "1";
    process.env.AI_GLOBAL_RATE_LIMIT_MAX = "1";

    expect(checkRateLimit("198.51.100.41").allowed).toBe(true);
    // Daily and global are both exhausted; daily must win.
    expect(checkRateLimit("198.51.100.41").reason).toBe("daily");
  });

  it("falls back to global for a fresh IP", () => {
    process.env.AI_RATE_LIMIT_MAX = "10";
    process.env.AI_RATE_LIMIT_DAILY_MAX = "10";
    process.env.AI_GLOBAL_RATE_LIMIT_MAX = "1";

    expect(checkRateLimit("198.51.100.42").allowed).toBe(true);
    expect(checkRateLimit("198.51.100.43").reason).toBe("global");
  });

  it("records nothing when a request is blocked by the daily cap", () => {
    process.env.AI_RATE_LIMIT_MAX = "10";
    process.env.AI_RATE_LIMIT_DAILY_MAX = "1";
    process.env.AI_GLOBAL_RATE_LIMIT_MAX = "100";

    expect(checkRateLimit("198.51.100.44").allowed).toBe(true);
    expect(checkRateLimit("198.51.100.44").reason).toBe("daily");

    // If the blocked call had recorded, daily would already be at 2.
    process.env.AI_RATE_LIMIT_DAILY_MAX = "2";
    expect(checkRateLimit("198.51.100.44").allowed).toBe(true);
    expect(checkRateLimit("198.51.100.44").reason).toBe("daily");
  });

  it("does not advance the global counter on a blocked arrival", () => {
    process.env.AI_RATE_LIMIT_MAX = "10";
    process.env.AI_RATE_LIMIT_DAILY_MAX = "100";
    process.env.AI_GLOBAL_RATE_LIMIT_MAX = "1";

    expect(checkRateLimit("198.51.100.45").allowed).toBe(true);
    expect(checkRateLimit("198.51.100.45").reason).toBe("global");

    // If the blocked arrival had counted, global would already be at 2.
    process.env.AI_GLOBAL_RATE_LIMIT_MAX = "2";
    expect(checkRateLimit("198.51.100.45").allowed).toBe(true);
    expect(checkRateLimit("198.51.100.45").reason).toBe("global");
  });
});

describe("resetRateLimits", () => {
  it("clears the minute, daily, and global stores", () => {
    process.env.AI_RATE_LIMIT_MAX = "10";
    process.env.AI_RATE_LIMIT_DAILY_MAX = "1";
    process.env.AI_GLOBAL_RATE_LIMIT_MAX = "1";

    expect(checkRateLimit("198.51.100.60").allowed).toBe(true);
    resetRateLimits();
    // Without a full reset, the daily or global store would block this.
    expect(checkRateLimit("198.51.100.60").allowed).toBe(true);
  });
});
