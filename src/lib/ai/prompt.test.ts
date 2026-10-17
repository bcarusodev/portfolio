import { describe, expect, it } from "vitest";
import {
  buildSystemPrompt,
  trimHistory,
  CONTINUATION_INSTRUCTION,
  GUARDRAIL_EN,
  GUARDRAIL_ES,
} from "@/lib/ai/prompt";
import type { IPromptMessage } from "@/lib/ai/prompt";
import type { IKBSelection } from "@/lib/ai/knowledge";

const selection = (content: string): IKBSelection => ({
  content,
  digest: "- Bio",
  mode: "sections",
  tokens: 10,
});

/** The instruction block alone, without the KB or the language hint. */
const instructionBlock = (): string =>
  buildSystemPrompt({ selection: selection("KB-CONTENT") }).split(
    "KNOWLEDGE BASE:"
  )[0];

describe("buildSystemPrompt", () => {
  it("embeds the guardrail instructions and the selected knowledge base", () => {
    const prompt = buildSystemPrompt({ selection: selection("KB-CONTENT") });
    expect(prompt).toContain(
      "You are the assistant embedded in Bruno Caruso's portfolio website"
    );
    expect(prompt).toContain("KNOWLEDGE BASE:");
    expect(prompt).toContain("KB-CONTENT");
  });

  it("adds the interface-language fallback hint only when a language is given", () => {
    const withLanguage = buildSystemPrompt({
      selection: selection("x"),
      language: "en",
    });
    expect(withLanguage).toContain('The visitor\'s interface language is "en"');

    expect(buildSystemPrompt({ selection: selection("x") })).not.toContain(
      "interface language"
    );
  });

  it("appends the knowledge base after the instructions", () => {
    const prompt = buildSystemPrompt({ selection: selection("KB-CONTENT") });
    expect(prompt.indexOf("KNOWLEDGE BASE:")).toBeGreaterThan(
      prompt.indexOf("RULES:")
    );
  });

  it("keeps the language hint last so the knowledge base prefix stays cacheable", () => {
    const spanish = buildSystemPrompt({
      selection: selection("KB-CONTENT"),
      language: "es",
    });
    const english = buildSystemPrompt({
      selection: selection("KB-CONTENT"),
      language: "en",
    });

    expect(spanish.indexOf("KB-CONTENT")).toBeLessThan(
      spanish.indexOf("interface language")
    );
    // Different visitors, different interface language: everything before the
    // hint is byte-identical, so the provider can reuse its cached prefix.
    const sharedPrefix = spanish.slice(
      0,
      spanish.indexOf("interface language")
    );
    expect(english.startsWith(sharedPrefix)).toBe(true);
  });
});

describe("guardrail constants", () => {
  it("expose distinct non-empty ES/EN re-anchoring messages", () => {
    expect(GUARDRAIL_ES.length).toBeGreaterThan(0);
    expect(GUARDRAIL_EN.length).toBeGreaterThan(0);
    expect(GUARDRAIL_ES).not.toBe(GUARDRAIL_EN);
  });
});

describe("answer length discipline", () => {
  it("numbers its rules contiguously with no gaps or duplicates", () => {
    const block = instructionBlock();
    const numbers: number[] = [];
    const pattern = /^(\d+)\. /gm;
    let match = pattern.exec(block);
    while (match !== null) {
      numbers.push(Number(match[1]));
      match = pattern.exec(block);
    }

    expect(numbers.length).toBeGreaterThan(0);
    expect(numbers).toEqual(numbers.map((_, index) => index + 1));
  });

  it("bounds the answer with a concrete length budget", () => {
    expect(instructionBlock()).toMatch(/at most ~\d+ words/i);
  });

  it("keeps the whole instruction block inside its token budget", () => {
    // The instruction block rides on every request. Ceiling is a ratchet:
    // 646 tokens before the length-discipline rule, 706 after. Growing it
    // further is a deliberate budget decision, not a side effect.
    // estimateTokens = ceil(length / 4).
    expect(Math.ceil(instructionBlock().length / 4)).toBeLessThanOrEqual(720);
  });
});

describe("CONTINUATION_INSTRUCTION", () => {
  it("is a non-empty directive that forbids repetition and any preamble", () => {
    expect(CONTINUATION_INSTRUCTION.length).toBeGreaterThan(0);
    expect(CONTINUATION_INSTRUCTION).toMatch(/no repetition/i);
    expect(CONTINUATION_INSTRUCTION).toMatch(/no preamble/i);
    expect(CONTINUATION_INSTRUCTION).toMatch(/same language/i);
  });

  it("stays out of the system prompt so the cached prefix survives", () => {
    // It is appended as a per-request message, never as system context:
    // putting it in the system prompt would break the stable prefix the
    // provider caches, and cached tokens are excluded from rate limits.
    expect(
      buildSystemPrompt({ selection: selection("KB-CONTENT") })
    ).not.toContain(CONTINUATION_INSTRUCTION);
  });
});

describe("trimHistory", () => {
  const message = (
    role: IPromptMessage["role"],
    content: string
  ): IPromptMessage => ({ role, content });

  it("drops entries with an invalid role or blank content", () => {
    const history = [
      { role: "system", content: "not a chat turn" },
      message("user", "   "),
      message("user", "hello"),
      message("assistant", "hi"),
    ] as unknown as IPromptMessage[];

    expect(trimHistory(history).map((entry) => entry.content)).toEqual([
      "hello",
      "hi",
    ]);
  });

  it("keeps at most maxMessages recent turns in chronological order", () => {
    const history = Array.from({ length: 12 }, (_, index) =>
      message(index % 2 === 0 ? "user" : "assistant", `message ${index}`)
    );

    expect(
      trimHistory(history, 4, 10_000).map((entry) => entry.content)
    ).toEqual(["message 8", "message 9", "message 10", "message 11"]);
  });

  it("drops older messages once the token budget is exceeded", () => {
    // estimateTokens = ceil(length / 4): 400 chars -> 100 tokens.
    const history = [
      message("user", "a".repeat(400)),
      message("assistant", "b".repeat(40)),
    ];

    const result = trimHistory(history, 8, 20);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("b".repeat(40));
  });

  it("returns nothing when even the newest message exceeds the budget", () => {
    expect(trimHistory([message("user", "a".repeat(400))], 8, 20)).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const history = [message("user", "one"), message("assistant", "two")];
    const snapshot = [...history];

    trimHistory(history, 1, 10_000);
    expect(history).toEqual(snapshot);
  });

  it("defaults to 6 turns so a longer chat cannot inflate every request", () => {
    const history = Array.from({ length: 10 }, (_, index) =>
      message(index % 2 === 0 ? "user" : "assistant", `message ${index}`)
    );

    expect(trimHistory(history).map((entry) => entry.content)).toEqual([
      "message 4",
      "message 5",
      "message 6",
      "message 7",
      "message 8",
      "message 9",
    ]);
  });

  it("defaults to an 800-token history budget", () => {
    // estimateTokens = ceil(length / 4): 4000 chars -> 1000 tokens.
    const history = [
      message("user", "a".repeat(4000)),
      message("assistant", "b".repeat(800)),
    ];

    // 200 + 1000 > 800, so only the newest survives; the previous 1500-token
    // default would have kept both.
    const kept = trimHistory(history).map((entry) => entry.content);
    expect(kept).toEqual(["b".repeat(800)]);
  });
});
