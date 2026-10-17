import fs from "fs";
import path from "path";

/**
 * Knowledge base loader (T-01).
 *
 * Reads the markdown KB once per process (NFR-02) and serves it either in
 * full or as keyword-ranked sections when the full text exceeds the token
 * budget for the free-tier provider (design decision #4: "auto mode").
 */

const KB_PATH = path.join(
  process.cwd(),
  "assets",
  "agent-knowledge",
  "knowledge-base-complete.md"
);

/** Conservative token estimate: ~4 chars per token. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface IKBSection {
  /** Heading level (2 for `##`, 3 for `###`). */
  level: number;
  title: string;
  /** Raw markdown of the section, heading line included. */
  content: string;
  /** Document order index, used to restore reading order. */
  index: number;
}

export interface IKnowledgeBase {
  raw: string;
  sections: IKBSection[];
}

export interface IKBSelection {
  /** KB content to place in the system prompt (sections or full text). */
  content: string;
  /** Compact index of every heading, always included (FR-21 support). */
  digest: string;
  mode: "full" | "sections";
  tokens: number;
}

const STOP_WORDS = new Set([
  // English
  "the",
  "and",
  "for",
  "you",
  "your",
  "are",
  "was",
  "with",
  "that",
  "this",
  "have",
  "has",
  "had",
  "but",
  "not",
  "what",
  "when",
  "who",
  "why",
  "how",
  "can",
  "could",
  "would",
  "should",
  "does",
  "did",
  "from",
  "they",
  "them",
  "his",
  "her",
  "its",
  "our",
  "their",
  "about",
  "into",
  "than",
  "then",
  "there",
  "here",
  "been",
  "being",
  "will",
  "just",
  "like",
  "some",
  "more",
  "most",
  "other",
  "also",
  "any",
  "all",
  "get",
  "got",
  "tell",
  "know",
  "does",
  "much",
  "many",
  "very",
  "too",
  "only",
  "over",
  "under",
  "out",
  // Spanish
  "los",
  "las",
  "una",
  "unos",
  "unas",
  "del",
  "por",
  "para",
  "con",
  "como",
  "que",
  "cual",
  "cuando",
  "donde",
  "quien",
  "como",
  "porque",
  "sobre",
  "este",
  "esta",
  "estos",
  "estas",
  "ese",
  "esa",
  "eso",
  "pero",
  "mas",
  "muy",
  "tambien",
  "tiene",
  "tienen",
  "hacer",
  "puede",
  "pueden",
  "son",
  "era",
  "fue",
  "hay",
  "que",
  "cuentame",
  "hola",
  "bruno", // name is everywhere, it never discriminates sections
]);

interface ICache {
  kb: IKnowledgeBase;
}

let cache: ICache | null = null;

/** Split raw markdown into `##` sections (level-3 headings stay inside). */
function splitSections(raw: string): IKBSection[] {
  const lines = raw.split(/\r?\n/);
  const sections: IKBSection[] = [];
  let current: string[] | null = null;
  let title = "";
  let index = 0;

  const push = () => {
    if (current && current.join("\n").trim().length > 0) {
      sections.push({ level: 2, title, content: current.join("\n"), index });
      index += 1;
    }
    current = null;
  };

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      push();
      title = line.replace(/^##\s+/, "").trim();
      current = [line];
    } else if (current) {
      current.push(line);
    } else {
      // Preamble before the first `##` heading (the document title).
      current = [line];
      title = "";
    }
  }
  push();
  return sections;
}

/**
 * Read and cache the KB. Throws when the file is missing so the API route
 * can answer 503 (design error table: "KB missing → 503").
 */
export function getKnowledgeBase(): IKnowledgeBase {
  if (cache) return cache.kb;
  const raw = fs.readFileSync(KB_PATH, "utf8");
  const kb: IKnowledgeBase = { raw, sections: splitSections(raw) };
  cache = { kb };
  return kb;
}

function normalizeText(text: string): string {
  // Strip accents so ES/EN keywords match regardless of diacritics.
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

/** Compact `## / ###` index so the model knows what the KB does not cover. */
function buildDigest(kb: IKnowledgeBase): string {
  const lines: string[] = [];
  for (const section of kb.sections) {
    if (section.title) lines.push(`- ${section.title}`);
    const sub = section.content.match(/^###\s+.+$/gm);
    if (sub) {
      for (const heading of sub) {
        lines.push(`  - ${heading.replace(/^###\s+/, "").trim()}`);
      }
    }
  }
  return lines.join("\n");
}

function rankSections(
  sections: IKBSection[],
  keywords: string[]
): IKBSection[] {
  if (keywords.length === 0) return sections.map((s) => s);
  const scored = sections.map((section) => {
    const haystack = normalizeText(section.content);
    const heading = normalizeText(section.title);
    let score = 0;
    for (const keyword of keywords) {
      const inBody = haystack.split(keyword).length - 1;
      if (inBody > 0) score += 1 + Math.min(inBody, 5) / 10;
      if (heading.includes(keyword)) score += 3;
    }
    // Normalize by query length so scores stay comparable across queries.
    return { section, score: score / keywords.length };
  });
  return scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.section.index - b.section.index)
    .map((entry) => entry.section);
}

/**
 * Select KB content for a query under `maxTokens` (AI_MAX_KB_TOKENS).
 *
 * - Full KB when it fits the budget ("auto mode").
 * - Otherwise: keyword-ranked `##` sections greedily fill the budget,
 *   followed by the heading digest (always) so the model can answer
 *   "I don't have that info" instead of hallucinating (FR-21).
 */
export function selectKnowledge(
  query: string,
  maxTokens: number = Number(process.env.AI_MAX_KB_TOKENS || 5000)
): IKBSelection {
  const kb = getKnowledgeBase();
  const digest = buildDigest(kb);
  const digestTokens = estimateTokens(digest) + 2; // leading label

  if (estimateTokens(kb.raw) + digestTokens <= maxTokens) {
    return {
      content: kb.raw,
      digest,
      mode: "full",
      tokens: estimateTokens(kb.raw) + digestTokens,
    };
  }

  const budget = Math.max(0, maxTokens - digestTokens);
  const keywords = tokenize(query);
  const ranked = rankSections(kb.sections, keywords);

  // No keyword overlap: fall back to document order (Bio first, then
  // experience) so greetings still get a grounded identity context.
  const candidates = ranked.length > 0 ? ranked : kb.sections;

  const selected: IKBSection[] = [];
  let used = 0;
  for (const section of candidates) {
    const tokens = estimateTokens(section.content);
    if (used + tokens <= budget) {
      selected.push(section);
      used += tokens;
      continue;
    }
    if (selected.length === 0) {
      // A single section larger than the whole budget: truncate it.
      const truncated = truncateToTokens(section.content, budget);
      selected.push({ ...section, content: truncated });
      used = budget;
      break;
    }
    // Otherwise skip the oversized section and keep trying smaller ones.
  }

  selected.sort((a, b) => a.index - b.index);
  const content =
    selected.map((section) => section.content.trim()).join("\n\n") +
    `\n\n## Section Index (headings available in the full knowledge base)\n${digest}`;

  return {
    content,
    digest,
    mode: "sections",
    tokens: estimateTokens(content),
  };
}

function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const lastNewline = slice.lastIndexOf("\n");
  return (lastNewline > 0 ? slice.slice(0, lastNewline) : slice).trimEnd();
}
