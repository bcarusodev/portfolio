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

  it("falls back to sections plus the heading digest when the budget is small", () => {
    const kb = getKnowledgeBase();
    const result = selectKnowledge("typescript projects", 300);

    expect(result.mode).toBe("sections");
    expect(result.content).toContain("## Section Index");
    expect(result.content).toContain(result.digest);
    expect(result.content.length).toBeLessThan(kb.raw.length);
  });

  it("keeps the selected sections in document order", () => {
    const kb = getKnowledgeBase();
    const result = selectKnowledge("experience skills projects", 4_000);

    const selectedIndexes = kb.sections
      .filter((section) => result.content.includes(section.content.trim()))
      .map((section) => section.index);

    expect(selectedIndexes).toEqual([...selectedIndexes].sort((a, b) => a - b));
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
