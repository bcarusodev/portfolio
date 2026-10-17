/**
 * In-process answer cache (chatbot rate limits).
 *
 * The free tier of the default provider allows ~30-70 answers a day, and a
 * portfolio assistant receives the same handful of questions over and over
 * ("¿Dónde trabaja Bruno?", "What's his stack?"). Serving an identical
 * question from memory costs zero upstream tokens, so repeats never touch the
 * RPM/TPM/TPD budgets.
 *
 * Scope and honesty about its limits (mirrors the rate limiter's design
 * decision #6): the cache is per process — it resets on redeploy and is not
 * shared across serverless instances. It is not a CDN and makes no
 * cross-instance guarantee.
 *
 * Safety rules:
 * - Only answers that already passed the guardrail validator are stored, and
 *   a hit is re-validated before it is served.
 * - Only history-less questions are eligible (the caller decides), because a
 *   follow-up depends on the turns before it and must not be replayed out of
 *   context.
 * - Bounded by `AI_ANSWER_CACHE_MAX` entries and `AI_ANSWER_CACHE_TTL_MS`.
 */

const DEFAULT_MAX = 50;
const DEFAULT_TTL_MS = 15 * 60 * 1000;

interface ICacheEntry {
  text: string;
  storedAt: number;
}

const entries = new Map<string, ICacheEntry>();

function readNonNegativeInt(
  value: string | undefined,
  fallback: number
): number {
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

/**
 * Canonical form of a question: lowercase, accent-free, punctuation-free,
 * whitespace-collapsed. Returns `""` when nothing matchable remains, which
 * callers treat as "not cacheable".
 */
export function normalizeQuestion(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function keyFor(question: string, language: string): string | null {
  const normalized = normalizeQuestion(question);
  if (normalized.length === 0) return null;
  return `${language}\u0000${normalized}`;
}

/** Cached answer for an equivalent question, or `null` on any miss. */
export function readCachedAnswer(
  question: string,
  language: string
): string | null {
  if (readNonNegativeInt(process.env.AI_ANSWER_CACHE_MAX, DEFAULT_MAX) === 0) {
    return null;
  }
  const key = keyFor(question, language);
  if (key === null) return null;

  const entry = entries.get(key);
  if (!entry) return null;

  const ttl = readNonNegativeInt(
    process.env.AI_ANSWER_CACHE_TTL_MS,
    DEFAULT_TTL_MS
  );
  if (Date.now() - entry.storedAt > ttl) {
    entries.delete(key);
    return null;
  }
  return entry.text;
}

/** Store a guardrail-validated answer. No-op when caching is disabled. */
export function writeCachedAnswer(
  question: string,
  language: string,
  text: string
): void {
  const max = readNonNegativeInt(process.env.AI_ANSWER_CACHE_MAX, DEFAULT_MAX);
  const ttl = readNonNegativeInt(
    process.env.AI_ANSWER_CACHE_TTL_MS,
    DEFAULT_TTL_MS
  );
  if (max === 0 || ttl === 0 || text.trim().length === 0) return;

  const key = keyFor(question, language);
  if (key === null) return;

  // Re-writing a key refreshes its age and moves it to the newest slot.
  entries.delete(key);
  while (entries.size >= max) {
    const oldest = entries.keys().next().value;
    if (oldest === undefined) break;
    entries.delete(oldest);
  }
  entries.set(key, { text, storedAt: Date.now() });
}

/** Test/dev helper: drop every cached answer. */
export function resetAnswerCache(): void {
  entries.clear();
}
