import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getProvider, ProviderError } from "@/lib/ai/provider";
import type { IStreamRequest } from "@/lib/ai/provider";

const ENV_KEYS = [
  "NEXT_PUBLIC_AI_PROVIDER",
  "AI_PROVIDER_API_KEY",
  "AI_MODEL",
  "AI_PROVIDER_BASE_URL",
] as const;

const savedEnv = new Map<string, string | undefined>();

beforeEach(() => {
  for (const key of ENV_KEYS) {
    savedEnv.set(key, process.env[key]);
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = savedEnv.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const request = (): IStreamRequest => ({
  system: "system prompt",
  messages: [{ role: "user", content: "hi" }],
  maxTokens: 16,
  signal: new AbortController().signal,
});

/** Resolve with the rejection value so assertions stay explicit. */
const capture = async (promise: Promise<unknown>): Promise<unknown> =>
  promise.catch((error: unknown) => error);

describe("ProviderError", () => {
  it("carries the error name and an upstream HTTP status", () => {
    const error = new ProviderError("Provider responded with 429", 429);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ProviderError");
    expect(error.message).toBe("Provider responded with 429");
    expect(error.status).toBe(429);
  });

  it("leaves status undefined when no upstream status is known", () => {
    expect(new ProviderError("unreachable").status).toBeUndefined();
  });
});

describe("getProvider", () => {
  it("defaults to groq when NEXT_PUBLIC_AI_PROVIDER is unset", () => {
    expect(typeof getProvider().streamChat).toBe("function");
  });

  it.each(["groq", "cerebras", "openai"])("resolves the %s provider", (key) => {
    process.env.NEXT_PUBLIC_AI_PROVIDER = key;
    expect(typeof getProvider().streamChat).toBe("function");
  });

  it("normalizes the provider key case-insensitively", () => {
    process.env.NEXT_PUBLIC_AI_PROVIDER = "GROQ";
    expect(typeof getProvider().streamChat).toBe("function");
  });

  it("throws a 503 ProviderError for an unknown provider key", () => {
    process.env.NEXT_PUBLIC_AI_PROVIDER = "nope";

    let caught: ProviderError | null = null;
    try {
      getProvider();
    } catch (error) {
      caught = error as ProviderError;
    }

    expect(caught).toBeInstanceOf(ProviderError);
    expect(caught?.status).toBe(503);
    expect(caught?.message).toBe('Unknown AI provider "nope"');
  });
});

describe("streamChat", () => {
  it("rejects with a 503 ProviderError when AI_PROVIDER_API_KEY is missing", async () => {
    const error = await capture(getProvider().streamChat(request()).next());

    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({ name: "ProviderError", status: 503 });
    expect((error as ProviderError).message).toBe(
      "AI_PROVIDER_API_KEY is not configured"
    );
  });
});
