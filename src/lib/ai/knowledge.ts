import fs from "fs";
import path from "path";

/**
 * Knowledge base loader (T-01).
 *
 * Reads the markdown KB once per process (NFR-02) and serves it either in
 * full or as keyword-ranked chunks when the full text exceeds the token
 * budget for the free-tier provider (design decision #4: "auto mode").
 *
 * Rate-limit budget change (chatbot rate limits):
 *
 * - Retrieval is chunked at `###` granularity, so one question ships the
 *   relevant subsections instead of a whole multi-thousand-token `##`
 *   section (the old `## Work Experience` alone was 4.1K tokens).
 * - The heading index and the pinned identity core are placed FIRST and are
 *   byte-identical for every query, which is what lets Groq's automatic
 *   prompt caching treat that prefix as cached (cached tokens do not count
 *   towards rate limits).
 * - The `## System Prompt Context` section is retrieval-excluded: it
 *   duplicates the guardrail instructions already in `prompt.ts`.
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

/**
 * Smallest retrievable unit: a `###` subsection, or a `##` section that has
 * no subsections of its own. Heading-only chunks are never emitted, so a
 * level-3 chunk renders under the parent heading that `renderChunks` emits
 * from `parentTitle`.
 */
export interface IKBChunk {
  /** Stable id derived from document order. */
  id: string;
  level: 2 | 3;
  title: string;
  /** Owning `##` title for level-3 chunks; `""` for level 2. */
  parentTitle: string;
  /** Raw markdown of the chunk, heading line included. */
  content: string;
  /** Document order index, used to restore reading order. */
  index: number;
  /** Precomputed `estimateTokens(content)` — chunks are ranked per request. */
  tokens: number;
}

export interface IKnowledgeBase {
  raw: string;
  /** Level-2 sections (unchanged contract: heading + nested subsections). */
  sections: IKBSection[];
  /** Retrieval units used by `selectKnowledge`. */
  chunks: IKBChunk[];
}

export interface IKBSelection {
  /**
   * KB content to place in the system prompt. Starts with the stable block
   * (heading index + pinned core) and continues with the query-specific
   * chunks, so the provider sees a cacheable prefix.
   */
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

/**
 * Sections that exist to brief the extraction prompt, not to answer
 * visitors; `prompt.ts` already ships those rules as guardrails.
 */
const META_SECTION_TITLES = new Set(["System Prompt Context"]);

/**
 * Identity context pinned to every request (see `AI_KB_CORE_SECTIONS`):
 * ~300 tokens that answer "who is this" without a retrieval match. The rest
 * of the Bio (philosophy, preferences, workflow) is retrieved on demand.
 */
const DEFAULT_CORE_SECTIONS = ["Identity", "Elevator Pitch", "Current Role"];

const HEADING_2 = /^##\s+/;
const HEADING_3 = /^###\s+/;

const INDEX_LABEL =
  "## Section Index (headings available in the full knowledge base)";

interface ICache {
  kb: IKnowledgeBase;
}

let cache: ICache | null = null;

/**
 * Single pass that produces both representations:
 * - `sections`: level-2 sections including their nested subsections.
 * - `chunks`: level-3 subsections under their `##` parent, plus level-2
 *   sections that carry their own body.
 */
function splitKnowledge(raw: string): {
  sections: IKBSection[];
  chunks: IKBChunk[];
} {
  const lines = raw.split(/\r?\n/);
  const sections: IKBSection[] = [];
  const chunks: IKBChunk[] = [];

  let sectionLines: string[] | null = null;
  let sectionTitle = "";
  let sectionIndex = 0;

  let chunkLines: string[] = [];
  let chunkLevel: 2 | 3 = 2;
  let chunkTitle = "";
  let chunkParent = "";
  let chunkIndex = 0;

  const flushChunk = () => {
    const content = chunkLines.join("\n").trim();
    // A chunk that is only its own heading retrieves nothing: the parent
    // heading is re-emitted by `renderChunks` from `parentTitle`.
    if (content.length > 0 && content.split("\n").length > 1) {
      chunks.push({
        id: `chunk-${chunkIndex}`,
        level: chunkLevel,
        title: chunkTitle,
        parentTitle: chunkParent,
        content,
        index: chunkIndex,
        tokens: estimateTokens(content),
      });
    }
    chunkIndex += 1;
    chunkLines = [];
  };

  const flushSection = () => {
    if (sectionLines && sectionLines.join("\n").trim().length > 0) {
      sections.push({
        level: 2,
        title: sectionTitle,
        content: sectionLines.join("\n"),
        index: sectionIndex,
      });
      sectionIndex += 1;
    }
    sectionLines = null;
  };

  for (const line of lines) {
    if (HEADING_2.test(line)) {
      flushChunk();
      flushSection();
      sectionTitle = line.replace(HEADING_2, "").trim();
      sectionLines = [line];
      chunkLevel = 2;
      chunkTitle = sectionTitle;
      chunkParent = "";
      chunkLines = [line];
      continue;
    }

    if (HEADING_3.test(line) && sectionLines && sectionTitle !== "") {
      flushChunk();
      chunkLevel = 3;
      chunkTitle = line.replace(HEADING_3, "").trim();
      chunkParent = sectionTitle;
      chunkLines = [line];
    } else {
      chunkLines.push(line);
    }

    if (!sectionLines) {
      sectionTitle = "";
      sectionLines = [];
    }
    sectionLines.push(line);
  }

  flushChunk();
  flushSection();
  return { sections, chunks };
}

/**
 * Read and cache the KB. Throws when the file is missing so the API route
 * can answer 503 (design error table: "KB missing → 503").
 */
export function getKnowledgeBase(): IKnowledgeBase {
  if (cache) return cache.kb;
  const raw = fs.readFileSync(KB_PATH, "utf8");
  const kb: IKnowledgeBase = { raw, ...splitKnowledge(raw) };
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

/** Owning `##` title of a chunk (its own title when already level 2). */
function ownerTitle(chunk: IKBChunk): string {
  return chunk.level === 3 ? chunk.parentTitle : chunk.title;
}

/** Compact `## / ###` index so the model knows what the KB does not cover. */
function buildDigest(kb: IKnowledgeBase): string {
  const lines: string[] = [];
  for (const section of kb.sections) {
    if (META_SECTION_TITLES.has(section.title)) continue;
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

/**
 * `AI_KB_CORE_SECTIONS` — comma-separated headings pinned to every request.
 * A heading matches either a chunk's own `###` title or its owning `##`
 * title (`Bio` pins all of Bio). Unset uses the default; an empty value
 * disables the pinned core. Titles no longer in the KB are skipped.
 */
function coreTitlesFromEnv(): string[] {
  const raw = process.env.AI_KB_CORE_SECTIONS;
  if (raw === undefined) return DEFAULT_CORE_SECTIONS;
  return raw
    .split(",")
    .map((title) => title.trim())
    .filter((title) => title.length > 0);
}

function rankChunks(chunks: IKBChunk[], keywords: string[]): IKBChunk[] {
  if (keywords.length === 0) return chunks.map((chunk) => chunk);
  const scored = chunks.map((chunk) => {
    const haystack = normalizeText(chunk.content);
    const heading = normalizeText(chunk.title);
    const parent = normalizeText(chunk.parentTitle);
    let score = 0;
    for (const keyword of keywords) {
      const inBody = haystack.split(keyword).length - 1;
      if (inBody > 0) score += 1 + Math.min(inBody, 5) / 10;
      if (heading.includes(keyword)) score += 3;
      if (parent.length > 0 && parent.includes(keyword)) score += 2;
    }
    // Normalize by query length so scores stay comparable across queries.
    return { chunk, score: score / keywords.length };
  });
  return scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.chunk.index - b.chunk.index)
    .map((entry) => entry.chunk);
}

/**
 * Render selected chunks in document order. Consecutive level-3 chunks share
 * one `## Parent` heading instead of repeating the parent title per chunk.
 */
function renderChunks(chunks: IKBChunk[]): string {
  const parts: string[] = [];
  let openParent = "";
  for (const chunk of chunks) {
    if (chunk.level === 3 && chunk.parentTitle !== openParent) {
      openParent = chunk.parentTitle;
      parts.push(`## ${chunk.parentTitle}`);
    }
    parts.push(chunk.content);
  }
  return parts.join("\n\n");
}

/**
 * Select KB content for a query under `maxTokens` (AI_MAX_KB_TOKENS).
 *
 * - Full KB when it fits the budget ("auto mode").
 * - Otherwise: the heading index, then the pinned identity core, then
 *   keyword-ranked chunks greedily filling the budget. The index and core
 *   come first and never change between queries, so the provider can cache
 *   that prefix (cached tokens do not count towards rate limits).
 *
 * The index is always present so the model can answer "I don't have that
 * info" instead of hallucinating (FR-21).
 */
export function selectKnowledge(
  query: string,
  maxTokens: number = Number(process.env.AI_MAX_KB_TOKENS || 2500)
): IKBSelection {
  const kb = getKnowledgeBase();
  const digest = buildDigest(kb);
  const indexBlock = `${INDEX_LABEL}\n${digest}`;
  const stableTokens = estimateTokens(indexBlock) + 1;

  if (estimateTokens(kb.raw) + stableTokens <= maxTokens) {
    return {
      content: kb.raw,
      digest,
      mode: "full",
      tokens: estimateTokens(kb.raw) + stableTokens,
    };
  }

  let remaining = maxTokens - stableTokens;
  if (remaining <= 0) {
    // The budget cannot even hold the index: ship the index alone so the
    // model still knows what the KB covers.
    return {
      content: indexBlock,
      digest,
      mode: "sections",
      tokens: estimateTokens(indexBlock),
    };
  }

  const pool = kb.chunks.filter(
    (chunk) => !META_SECTION_TITLES.has(ownerTitle(chunk))
  );
  const wanted = coreTitlesFromEnv().map((title) => title.toLowerCase());
  const core = pool.filter(
    (chunk) =>
      wanted.includes(chunk.title.toLowerCase()) ||
      wanted.includes(ownerTitle(chunk).toLowerCase())
  );
  const coreIds = new Set(core.map((chunk) => chunk.id));

  const selected: IKBChunk[] = [];
  for (const chunk of core) {
    if (chunk.tokens <= remaining) {
      selected.push(chunk);
      remaining -= chunk.tokens;
    }
  }

  const rest = pool.filter((chunk) => !coreIds.has(chunk.id));
  const ranked = rankChunks(rest, tokenize(query));
  // No keyword overlap: fall back to document order (Bio first, then
  // experience) so greetings still get a grounded identity context.
  const candidates = ranked.length > 0 ? ranked : rest;

  for (const chunk of candidates) {
    if (chunk.tokens <= remaining) {
      selected.push(chunk);
      remaining -= chunk.tokens;
    }
    // Chunks that do not fit are skipped so smaller relevant ones still land.
  }

  if (selected.length === 0 && candidates.length > 0) {
    // Nothing fits: truncate the best-ranked chunk rather than ship nothing.
    const head = truncateToTokens(candidates[0].content, remaining);
    selected.push({
      ...candidates[0],
      content: head,
      tokens: estimateTokens(head),
    });
  }

  selected.sort((a, b) => a.index - b.index);
  const body = selected.length > 0 ? renderChunks(selected) : "";
  const content = body.length > 0 ? `${indexBlock}\n\n${body}` : indexBlock;

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
