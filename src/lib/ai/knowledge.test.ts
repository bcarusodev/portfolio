import { describe, expect, it } from "vitest";
import {
  estimateTokens,
  getKnowledgeBase,
  selectKnowledge,
} from "@/lib/ai/knowledge";

/**
 * These exercise the real knowledge base at
 * assets/agent-knowledge/knowledge-base-complete.md (resolved from
 * process.cwd()), so they double as a guard that the KB ships and that the
 * section splitter keeps its structure.
 */
describe("estimateTokens", () => {
  it("is ceil(length / 4)", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("abcde")).toBe(2);
    expect(estimateTokens("a".repeat(400))).toBe(100);
  });
});

describe("getKnowledgeBase", () => {
  it("splits the KB into level-2 sections with sequential document order", () => {
    const kb = getKnowledgeBase();

    expect(kb.raw.length).toBeGreaterThan(0);
    expect(kb.sections.length).toBeGreaterThan(0);
    expect(kb.sections.every((section) => section.level === 2)).toBe(true);
    expect(kb.sections.map((section) => section.index)).toEqual(
      kb.sections.map((_, index) => index)
    );
  });

  it("splits level-3 subsections into retrievable chunks with parent context", () => {
    const kb = getKnowledgeBase();

    const subsection = kb.chunks.find(
      (chunk) => chunk.level === 3 && chunk.title.includes("Remitee")
    );
    expect(subsection).toBeDefined();
    expect(subsection?.parentTitle).toBe("Work Experience");
    expect(subsection?.content).toContain("### Remitee");
  });

  it("keeps chunk order and a precomputed token estimate", () => {
    const kb = getKnowledgeBase();

    const indexes = kb.chunks.map((chunk) => chunk.index);
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
    expect(
      kb.chunks.every((chunk) => chunk.tokens === estimateTokens(chunk.content))
    ).toBe(true);
  });

  it("never indexes a heading-only chunk", () => {
    const kb = getKnowledgeBase();

    expect(
      kb.chunks.every((chunk) => chunk.content.trim().split("\n").length > 1)
    ).toBe(true);
  });

  it("caches the KB across calls", () => {
    expect(getKnowledgeBase()).toBe(getKnowledgeBase());
  });
});

describe("selectKnowledge", () => {
  it("returns the full KB when it fits the budget", () => {
    const kb = getKnowledgeBase();
    const result = selectKnowledge("experience", 100_000);

    expect(result.mode).toBe("full");
    expect(result.content).toBe(kb.raw);
    expect(result.digest.length).toBeGreaterThan(0);
    expect(result.tokens).toBeLessThanOrEqual(100_000);
  });

  it("always leads with the heading digest so the provider can cache the prefix", () => {
    const first = selectKnowledge("typescript projects", 3_000);
    const second = selectKnowledge("remitee fintech transfers", 3_000);

    expect(first.content.startsWith("## Section Index")).toBe(true);
    expect(second.content.startsWith("## Section Index")).toBe(true);

    // The stable prefix (index + pinned core) is byte-identical across
    // queries: that is what makes Groq's automatic prompt caching hit.
    let shared = 0;
    while (
      shared < first.content.length &&
      first.content[shared] === second.content[shared]
    ) {
      shared += 1;
    }
    expect(shared).toBeGreaterThan(1_000);
  });

  it("pins the identity core for every query", () => {
    const result = selectKnowledge("which database does he prefer", 3_000);

    expect(result.content).toContain("### Identity");
    expect(result.content).toContain("Full Name: Bruno Caruso");
  });

  it("lets AI_KB_CORE_SECTIONS disable the pinned core", () => {
    const saved = process.env.AI_KB_CORE_SECTIONS;
    process.env.AI_KB_CORE_SECTIONS = "";
    try {
      // "Full Name: Bruno Caruso" lives only in the Identity core chunk;
      // it scores zero for this query, so it can only be present if pinned.
      const result = selectKnowledge("remitee transfers", 3_000);
      expect(result.content).not.toContain("Full Name: Bruno Caruso");
    } finally {
      if (saved === undefined) delete process.env.AI_KB_CORE_SECTIONS;
      else process.env.AI_KB_CORE_SECTIONS = saved;
    }
  });

  it("retrieves at subsection granularity instead of whole work history", () => {
    const result = selectKnowledge("What did he do at Remitee?", 3_000);

    expect(result.content).toContain("### Remitee");
    // Chubut IT and IT Crowd are separate chunks and score zero here, so the
    // 4.1K-token Work Experience section is never shipped whole.
    expect(result.content).not.toContain("### Chubut IT");
    expect(result.tokens).toBeLessThan(3_000);
  });

  it("never ships the meta section that duplicates the guardrails", () => {
    const kb = getKnowledgeBase();
    const meta = kb.sections.find(
      (section) => section.title === "System Prompt Context"
    );

    expect(meta).toBeDefined();
    const result = selectKnowledge("system prompt context rules", 3_000);
    expect(result.content).not.toContain(meta?.content.trim());
    expect(result.digest).not.toContain("System Prompt Context");
  });

  it("falls back to sections plus the heading digest when the budget is small", () => {
    const kb = getKnowledgeBase();
    const result = selectKnowledge("typescript projects", 300);

    expect(result.mode).toBe("sections");
    expect(result.content).toContain("## Section Index");
    expect(result.content).toContain(result.digest);
    expect(result.content.length).toBeLessThan(kb.raw.length);
  });

  it("keeps the selected chunks in document order", () => {
    const kb = getKnowledgeBase();
    const result = selectKnowledge("experience skills projects", 4_000);

    const selectedHeadings = kb.chunks
      .filter((chunk) => result.content.includes(chunk.content))
      .map((chunk) => chunk.index);

    expect(selectedHeadings.length).toBeGreaterThan(0);
    expect(selectedHeadings).toEqual(
      [...selectedHeadings].sort((a, b) => a - b)
    );
  });

  it("stays inside the budget for production-sized budgets", () => {
    for (const query of ["hola", "remitee", "what stack does he use?"]) {
      expect(selectKnowledge(query, 3_000).tokens).toBeLessThanOrEqual(3_000);
    }
  });

  it("defaults to a free-tier-safe budget when AI_MAX_KB_TOKENS is unset", () => {
    const saved = process.env.AI_MAX_KB_TOKENS;
    delete process.env.AI_MAX_KB_TOKENS;
    try {
      for (const query of ["hola", "tell me about the legacy migration"]) {
        expect(selectKnowledge(query).tokens).toBeLessThanOrEqual(2_500);
      }
    } finally {
      if (saved !== undefined) process.env.AI_MAX_KB_TOKENS = saved;
    }
  });

  it("degrades gracefully when the budget cannot fit the digest", () => {
    const result = selectKnowledge("bruno", 60);

    expect(result.mode).toBe("sections");
    expect(result.content).toContain("## Section Index");
  });

  it("is deterministic for the same query and budget", () => {
    expect(selectKnowledge("skills", 300)).toEqual(
      selectKnowledge("skills", 300)
    );
  });
});
