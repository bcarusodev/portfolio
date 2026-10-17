import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  normalizeQuestion,
  readCachedAnswer,
  resetAnswerCache,
  writeCachedAnswer,
} from "@/lib/ai/answerCache";

/**
 * The answer cache exists to keep repeated questions (the common case on a
 * portfolio) from spending the provider's free-tier token budget at all.
 * It is process-local, bounded, and TTL'd.
 */
beforeEach(() => {
  resetAnswerCache();
  delete process.env.AI_ANSWER_CACHE_MAX;
  delete process.env.AI_ANSWER_CACHE_TTL_MS;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("normalizeQuestion", () => {
  it("collapses case, accents, punctuation, and whitespace", () => {
    const canonical = normalizeQuestion("¿Dónde trabaja BRUNO?");

    expect(canonical).toBe("donde trabaja bruno");
    expect(normalizeQuestion("  donde   trabaja bruno  ")).toBe(canonical);
    expect(normalizeQuestion("Donde trabaja bruno")).toBe(canonical);
    expect(normalizeQuestion("¿Dónde trabaja Bruno?!")).toBe(canonical);
  });

  it("returns an empty key when there is nothing to match on", () => {
    expect(normalizeQuestion("???")).toBe("");
    expect(normalizeQuestion("🚀")).toBe("");
  });
});

describe("readCachedAnswer / writeCachedAnswer", () => {
  it("returns the stored answer for an equivalent question", () => {
    writeCachedAnswer("¿Dónde trabaja Bruno?", "es", "En Remitee.");

    expect(readCachedAnswer("donde TRABAJA bruno", "es")).toBe("En Remitee.");
  });

  it("misses on a different language", () => {
    writeCachedAnswer("Where does he work?", "en", "At Remitee.");

    expect(readCachedAnswer("Where does he work?", "es")).toBeNull();
  });

  it("never stores a question with no normalizable content", () => {
    writeCachedAnswer("???", "es", "algo");

    expect(readCachedAnswer("???", "es")).toBeNull();
    expect(readCachedAnswer("", "es")).toBeNull();
  });

  it("is disabled when AI_ANSWER_CACHE_MAX is 0", () => {
    process.env.AI_ANSWER_CACHE_MAX = "0";
    writeCachedAnswer("hola", "es", "Hola!");

    expect(readCachedAnswer("hola", "es")).toBeNull();
  });

  it("evicts the oldest entry beyond AI_ANSWER_CACHE_MAX", () => {
    process.env.AI_ANSWER_CACHE_MAX = "2";
    writeCachedAnswer("uno", "es", "1");
    writeCachedAnswer("dos", "es", "2");
    writeCachedAnswer("tres", "es", "3");

    expect(readCachedAnswer("uno", "es")).toBeNull();
    expect(readCachedAnswer("dos", "es")).toBe("2");
    expect(readCachedAnswer("tres", "es")).toBe("3");
  });

  it("expires an entry after AI_ANSWER_CACHE_TTL_MS", () => {
    process.env.AI_ANSWER_CACHE_TTL_MS = "1000";
    writeCachedAnswer("hola", "es", "Hola!");

    vi.advanceTimersByTime(999);
    expect(readCachedAnswer("hola", "es")).toBe("Hola!");

    vi.advanceTimersByTime(2);
    expect(readCachedAnswer("hola", "es")).toBeNull();
  });

  it("keeps the default 15-minute TTL", () => {
    writeCachedAnswer("hola", "es", "Hola!");

    vi.advanceTimersByTime(14 * 60 * 1000);
    expect(readCachedAnswer("hola", "es")).toBe("Hola!");
  });

  it("is cleared by resetAnswerCache", () => {
    writeCachedAnswer("hola", "es", "Hola!");
    resetAnswerCache();

    expect(readCachedAnswer("hola", "es")).toBeNull();
  });
});
