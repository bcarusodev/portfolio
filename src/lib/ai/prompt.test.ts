import { describe, expect, it } from "vitest";
import {
  buildSystemPrompt,
  trimHistory,
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
});

describe("guardrail constants", () => {
  it("expose distinct non-empty ES/EN re-anchoring messages", () => {
    expect(GUARDRAIL_ES.length).toBeGreaterThan(0);
    expect(GUARDRAIL_EN.length).toBeGreaterThan(0);
    expect(GUARDRAIL_ES).not.toBe(GUARDRAIL_EN);
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
});
