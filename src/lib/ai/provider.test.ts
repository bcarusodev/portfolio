import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  getProvider,
  parseRetryAfter,
  ProviderError,
  trimSeamOverlap,
  TRUNCATED_FINISH_REASON,
} from "@/lib/ai/provider";
import type { IStreamFinish, IStreamRequest } from "@/lib/ai/provider";

const ENV_KEYS = [
  "NEXT_PUBLIC_AI_PROVIDER",
  "AI_PROVIDER_API_KEY",
  "AI_MODEL",
  "AI_PROVIDER_BASE_URL",
  "AI_REASONING_EFFORT",
] as const;

const originalEnv = new Map<string, string | undefined>();

type TMockMode = "pass" | "429";

let mockMode: TMockMode = "pass";
let mockRetryAfter: string | null = null;
let mockFinishReason: string | null = null;
let lastBody: Record<string, unknown> | null = null;
let mockBaseUrl = "";
let server: http.Server;

const request = (): IStreamRequest => ({
  system: "system prompt",
  messages: [{ role: "user", content: "hi" }],
  maxTokens: 16,
  signal: new AbortController().signal,
});

/** Resolve with the rejection value so assertions stay explicit. */
const capture = async (promise: Promise<unknown>): Promise<unknown> =>
  promise.catch((error: unknown) => error);

/** Collect a whole streamed completion so the request body can be asserted. */
async function drain(): Promise<string> {
  let text = "";
  for await (const delta of getProvider().streamChat(request())) {
    text += delta;
  }
  return text;
}

/** Drain the generator manually to reach its terminal finish reason. */
async function drainAll(): Promise<{
  deltas: string[];
  finish: IStreamFinish;
}> {
  const iterator = getProvider().streamChat(request());
  const deltas: string[] = [];
  for (;;) {
    const step = await iterator.next();
    // `IteratorResult` does not narrow: its `done` is optional on the yield side.
    if (step.done) return { deltas, finish: step.value as IStreamFinish };
    deltas.push(step.value as string);
  }
}

beforeAll(async () => {
  for (const key of ENV_KEYS) originalEnv.set(key, process.env[key]);

  server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk: Buffer) => {
      raw += chunk.toString();
    });
    req.on("end", () => {
      lastBody = JSON.parse(raw) as Record<string, unknown>;
      if (mockMode === "429") {
        res.statusCode = 429;
        if (mockRetryAfter !== null) {
          res.setHeader("retry-after", mockRetryAfter);
        }
        res.end("rate limited");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/event-stream" });
      res.write(
        `data: ${JSON.stringify({
          choices: [{ delta: { content: "hola" } }],
        })}\n\n`
      );
      if (mockFinishReason !== null) {
        // OpenAI-compatible servers close with a delta-less chunk that only
        // carries `finish_reason`.
        res.write(
          `data: ${JSON.stringify({
            choices: [{ delta: {}, finish_reason: mockFinishReason }],
          })}\n\n`
        );
      }
      res.end("data: [DONE]\n\n");
    });
  });
  await new Promise<void>((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve())
  );
  const { port } = server.address() as AddressInfo;
  mockBaseUrl = `http://127.0.0.1:${port}/v1`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  for (const key of ENV_KEYS) {
    const value = originalEnv.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

beforeEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
  mockMode = "pass";
  mockRetryAfter = null;
  mockFinishReason = null;
  lastBody = null;
  process.env.AI_PROVIDER_BASE_URL = mockBaseUrl;
  process.env.AI_PROVIDER_API_KEY = "test-key";
});

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

  it("carries the upstream retry-after hint in milliseconds", () => {
    expect(new ProviderError("429", 429, 4100).retryAfterMs).toBe(4100);
    expect(new ProviderError("429", 429).retryAfterMs).toBeUndefined();
  });
});

describe("parseRetryAfter", () => {
  it("converts the seconds form to milliseconds", () => {
    expect(parseRetryAfter("4.1")).toBe(4100);
    expect(parseRetryAfter("0")).toBe(0);
    expect(parseRetryAfter(" 2 ")).toBe(2000);
  });

  it("accepts the HTTP-date form and clamps a past date to zero", () => {
    const future = parseRetryAfter(new Date(Date.now() + 5_000).toUTCString());
    expect(future).toBeGreaterThan(0);
    expect(future).toBeLessThanOrEqual(6_000);

    expect(parseRetryAfter(new Date(Date.now() - 5_000).toUTCString())).toBe(0);
  });

  it("returns undefined for missing or unparseable values", () => {
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter("")).toBeUndefined();
    expect(parseRetryAfter("soon")).toBeUndefined();
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
    delete process.env.AI_PROVIDER_API_KEY;
    const error = await capture(getProvider().streamChat(request()).next());

    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({ name: "ProviderError", status: 503 });
    expect((error as ProviderError).message).toBe(
      "AI_PROVIDER_API_KEY is not configured"
    );
  });
});

describe("streamChat wire format", () => {
  it("asks gpt-oss for low reasoning effort by default", async () => {
    expect(await drain()).toBe("hola");
    expect(lastBody?.reasoning_effort).toBe("low");
    expect(lastBody?.max_completion_tokens).toBe(16);
  });

  it("honours AI_REASONING_EFFORT and omits the parameter when unsupported", async () => {
    process.env.AI_REASONING_EFFORT = "medium";
    await drain();
    expect(lastBody?.reasoning_effort).toBe("medium");

    // The parameter is gpt-oss specific: an unsupported value must drop the
    // field instead of sending something Groq rejects with a 400.
    process.env.AI_REASONING_EFFORT = "none";
    await drain();
    expect(lastBody).not.toHaveProperty("reasoning_effort");
  });

  it("omits reasoning_effort for providers that do not support it", async () => {
    process.env.NEXT_PUBLIC_AI_PROVIDER = "cerebras";
    await drain();

    expect(lastBody).not.toHaveProperty("reasoning_effort");
  });

  it("surfaces the upstream retry-after on a 429", async () => {
    mockMode = "429";
    mockRetryAfter = "4.1";
    const error = await capture(drain());

    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({ status: 429, retryAfterMs: 4100 });
  });

  it("leaves retryAfterMs undefined when the 429 carries no header", async () => {
    mockMode = "429";
    mockRetryAfter = null;
    const error = await capture(drain());

    expect(error).toMatchObject({ status: 429, retryAfterMs: undefined });
  });
});

describe("streamChat finish reason", () => {
  it("returns the upstream finish_reason once the stream ends", async () => {
    mockFinishReason = TRUNCATED_FINISH_REASON;
    const { deltas, finish } = await drainAll();

    expect(deltas).toEqual(["hola"]);
    expect(finish).toEqual({ reason: "length" });
  });

  it("returns a null reason when the stream never sends one", async () => {
    const { deltas, finish } = await drainAll();

    expect(deltas).toEqual(["hola"]);
    expect(finish).toEqual({ reason: null });
  });

  it("does not yield an empty delta for the delta-less closing chunk", async () => {
    mockFinishReason = "stop";
    const { deltas } = await drainAll();

    expect(deltas).toEqual(["hola"]);
  });

  it("keeps the reason from the last chunk that carries one", async () => {
    mockFinishReason = "content_filter";
    const { finish } = await drainAll();

    expect(finish).toEqual({ reason: "content_filter" });
  });
});

describe("trimSeamOverlap", () => {
  it("drops the prefix the provider re-emitted before resuming", () => {
    // The exact seam measured live against Groq. The continuation restarted
    // five words before the cut, so a plain append shipped
    // "…ligeras parabases de datos ligeras para…" to the visitor.
    const partial =
      "más, fundó y gestionó una comunidad de jugadores alrededor del servidor. | **Lua**, herramientas de administración de servidores de juego, bases de datos ligeras para";
    const continuation =
      "bases de datos ligeras para almacenar puntuaciones y perfiles de usuarios. | **Autonomía**: aprendió a resolver problemas sin guía externa.";

    const merged = partial + trimSeamOverlap(partial, continuation);

    expect(merged).not.toContain("parabases");
    expect(merged).toContain(
      "bases de datos ligeras para almacenar puntuaciones y perfiles de usuarios."
    );
    expect(merged.match(/bases de datos ligeras para/g)).toHaveLength(1);
    expect(
      merged.endsWith(
        "**Autonomía**: aprendió a resolver problemas sin guía externa."
      )
    ).toBe(true);
  });

  it("returns the continuation untouched when nothing is repeated", () => {
    const partial = "Bruno empezó con scripts en **Lua** para un";
    const continuation = "gameserver de **MTA: San Andreas**.";

    expect(trimSeamOverlap(partial, continuation)).toBe(continuation);
  });

  it("keeps a single repeated word, which is content and not a seam", () => {
    const partial = "Le gusta trabajar de forma muy";
    const continuation = "muy meticulosa y ordenada.";

    expect(trimSeamOverlap(partial, continuation)).toBe(continuation);
  });

  it("trims the longest repeated run, not the shortest", () => {
    const partial = "Etapa uno de los primeros pasos";
    const continuation = "de los primeros pasos en desarrollo web.";

    // The separator that followed the repeated run is kept, so the caller can
    // append the result straight onto the partial.
    expect(trimSeamOverlap(partial, continuation)).toBe(" en desarrollo web.");
  });

  it("preserves the remainder byte-exact, markdown and line breaks included", () => {
    const partial = "trabajó en **Remitee** con modelado de dominio";
    const continuation =
      "con modelado de dominio (DDD).\n\n| Área | Detalle |\n|------|---------|\n| Rol | Especialista |\n";

    expect(trimSeamOverlap(partial, continuation)).toBe(
      " (DDD).\n\n| Área | Detalle |\n|------|---------|\n| Rol | Especialista |\n"
    );
  });

  it("leaves a mid-word cut alone, since the halves are not duplicates", () => {
    const partial = "herramientas de administra";
    const continuation = "ción de servidores de juego.";

    expect(trimSeamOverlap(partial, continuation)).toBe(continuation);
  });

  it("does not match a tail that only appears later in the continuation", () => {
    const partial = "primeros pasos en el desarrollo";
    const continuation = "Los primeros pasos en el desarrollo fueron en Lua.";

    expect(trimSeamOverlap(partial, continuation)).toBe(continuation);
  });

  it("returns an empty remainder when the continuation only repeats the tail", () => {
    const partial = "bases de datos ligeras para perfiles de usuarios";
    const continuation = "ligeras para perfiles de usuarios";

    expect(trimSeamOverlap(partial, continuation)).toBe("");
  });

  it("does not trim when there is nothing to trim against", () => {
    expect(trimSeamOverlap("", "primeros pasos en el desarrollo")).toBe(
      "primeros pasos en el desarrollo"
    );
    expect(trimSeamOverlap("primeros pasos", "")).toBe("");
  });
});
