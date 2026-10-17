import http from "node:http";
import type { AddressInfo, Socket } from "node:net";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  CONTINUATION_INSTRUCTION,
  GUARDRAIL_EN,
  GUARDRAIL_ES,
} from "@/lib/ai/prompt";
import { TRUNCATED_FINISH_REASON } from "@/lib/ai/provider";
import { resetAnswerCache } from "@/lib/ai/answerCache";
import { resetRateLimits } from "@/lib/ai/rateLimit";
import handler from "@/pages/api/chat";

/**
 * Integration tests for the SSE guardrail gate: a local `node:http`
 * OpenAI-compatible mock streams completions through the real provider
 * adapter, and req/res stubs drive the Next.js handler directly.
 */

interface IStreamEvent {
  type: "delta" | "done" | "error";
  delta?: string;
  code?: string;
  message?: string;
}

type TMockMode =
  | "pass"
  | "violating"
  | "status429"
  | "status429ThenPass"
  | "status500"
  | "empty"
  | "hang"
  | "truncated"
  | "truncatedThenPass"
  | "truncatedThenRepeats"
  | "truncatedThen429";

const PASS_DELTAS = ["Bruno ", "es desarrollador ", "frontend."];
/** What the provider sends when asked to resume a truncated answer. */
const CONTINUATION_DELTAS = [" Vive en Buenos ", "Aires."];
/** Continuation that re-emits the tail of PASS_DELTAS before resuming. */
const REPEAT_DELTAS = [
  "es desarrollador ",
  "frontend. ",
  "Vive en Buenos ",
  "Aires.",
];
/** Answer the route should deliver after resuming PASS_DELTAS. */
const RESUMED = PASS_DELTAS.join("") + CONTINUATION_DELTAS.join("");
const VIOLATION_DELTAS = ['{"rol": ', '"hacker"}'];

let mockMode: TMockMode = "pass";
let mockRetryAfter: string | null = null;
let providerRequests = 0;
let providerBodies: Array<Record<string, unknown>> = [];
let throttledOnce = false;
let providerSawAbort = false;
let savedRateMax: string | undefined;
let savedDailyMax: string | undefined;
let savedGlobalMax: string | undefined;
let savedContinuationsMax: string | undefined;
let savedVercel: string | undefined;
let savedBaseUrl: string | undefined;
let savedApiKey: string | undefined;
const sockets = new Set<Socket>();
let server: http.Server;

function sseDelta(text: string): string {
  return `data: ${JSON.stringify({
    choices: [{ delta: { content: text } }],
  })}\n\n`;
}

/** OpenAI-compatible servers close with a delta-less `finish_reason` chunk. */
function sseFinish(reason: string): string {
  return `data: ${JSON.stringify({
    choices: [{ delta: {}, finish_reason: reason }],
  })}\n\n`;
}

/** Modes whose follow-up provider request resumes a truncated answer. */
function continuesAfterTruncation(): boolean {
  return (
    mockMode === "truncated" ||
    mockMode === "truncatedThenPass" ||
    mockMode === "truncatedThenRepeats" ||
    mockMode === "truncatedThen429"
  );
}

/** Whether the current provider request should end at the completion cap. */
function isTruncatedResponse(): boolean {
  if (mockMode === "truncated") return true;
  if (continuesAfterTruncation()) return providerRequests === 1;
  return false;
}

/** Deltas the mock emits for the request currently in flight. */
function deltasForRequest(): string[] {
  if (mockMode === "violating") return VIOLATION_DELTAS;
  if (!continuesAfterTruncation() || providerRequests === 1) return PASS_DELTAS;
  return mockMode === "truncatedThenRepeats"
    ? REPEAT_DELTAS
    : CONTINUATION_DELTAS;
}

async function waitFor(
  condition: () => boolean,
  timeoutMs = 3000
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("waitFor: condition not met in time");
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

interface IResState {
  statusCode: number;
  headers: Record<string, unknown>;
  jsonBody: unknown;
  events: IStreamEvent[];
  headWritten: boolean;
  ended: boolean;
  closeListeners: Array<() => void>;
}

function createReq(
  message: string,
  ip: string,
  language = "es",
  history: Array<{ role: "user" | "assistant"; content: string }> = []
): NextApiRequest {
  return {
    method: "POST",
    body: { message, history, language },
    headers: { "x-forwarded-for": ip },
    socket: { remoteAddress: "127.0.0.1" },
  } as unknown as NextApiRequest;
}

/** Drain the SSE deltas a response streamed back into one string. */
function deltasOf(state: IResState): string {
  return state.events
    .filter((event) => event.type === "delta")
    .map((event) => event.delta)
    .join("");
}

/** The `messages` array the provider received on its Nth request. */
function messagesOf(index: number): Array<{ role: string; content: string }> {
  return (providerBodies[index]?.messages ?? []) as Array<{
    role: string;
    content: string;
  }>;
}

function createRes(): { res: NextApiResponse; state: IResState } {
  const state: IResState = {
    statusCode: 200,
    headers: {},
    jsonBody: undefined,
    events: [],
    headWritten: false,
    ended: false,
    closeListeners: [],
  };
  const res = {
    setHeader(name: string, value: unknown) {
      state.headers[name] = value;
      return res;
    },
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      state.jsonBody = payload;
      return res;
    },
    end() {
      state.ended = true;
      return res;
    },
    writeHead(code: number, headers?: Record<string, unknown>) {
      state.statusCode = code;
      if (headers) Object.assign(state.headers, headers);
      state.headWritten = true;
      return res;
    },
    write(chunk: string) {
      const match = /^data: ([\s\S]*)\n\n$/.exec(chunk);
      if (match) state.events.push(JSON.parse(match[1]) as IStreamEvent);
      return true;
    },
    on(event: string, listener: () => void) {
      if (event === "close") state.closeListeners.push(listener);
      return res;
    },
    flush() {
      /* not needed in tests */
    },
  };
  return { res: res as unknown as NextApiResponse, state };
}

beforeAll(async () => {
  savedRateMax = process.env.AI_RATE_LIMIT_MAX;
  savedDailyMax = process.env.AI_RATE_LIMIT_DAILY_MAX;
  savedGlobalMax = process.env.AI_GLOBAL_RATE_LIMIT_MAX;
  savedContinuationsMax = process.env.AI_CONTINUATIONS_MAX;
  savedVercel = process.env.VERCEL;
  savedBaseUrl = process.env.AI_PROVIDER_BASE_URL;
  savedApiKey = process.env.AI_PROVIDER_API_KEY;

  // R1/R6: without the VERCEL marker the resolver collapses every request
  // onto socket 127.0.0.1 and the XFF coverage disappears.
  process.env.VERCEL = "1";
  delete process.env.AI_RATE_LIMIT_DAILY_MAX;
  delete process.env.AI_GLOBAL_RATE_LIMIT_MAX;

  server = http.createServer((req, res) => {
    if (!req.url || !req.url.endsWith("/chat/completions")) {
      res.statusCode = 404;
      res.end();
      return;
    }

    const raw: string[] = [];
    req.on("data", (chunk: Buffer) => raw.push(chunk.toString()));
    req.on("end", () => {
      providerRequests += 1;
      try {
        providerBodies.push(
          JSON.parse(raw.join("")) as Record<string, unknown>
        );
      } catch {
        providerBodies.push({});
      }

      // The continuation call (any request after the first) fails when the
      // mode says so, after a wait too long for the route's retry to absorb.
      if (mockMode === "truncatedThen429" && providerRequests > 1) {
        res.statusCode = 429;
        res.setHeader("retry-after", "30");
        res.end("rate limited");
        return;
      }
      if (mockMode === "status429" || mockMode === "status429ThenPass") {
        if (mockMode === "status429ThenPass" && throttledOnce) {
          // Throttle once, then serve the real completion.
        } else {
          throttledOnce = true;
          res.statusCode = 429;
          if (mockRetryAfter !== null) {
            res.setHeader("retry-after", mockRetryAfter);
          }
          res.end("rate limited");
          return;
        }
      }
      if (mockMode === "status500") {
        res.statusCode = 500;
        res.end("provider error");
        return;
      }
      if (mockMode === "empty") {
        res.writeHead(200, { "Content-Type": "text/event-stream" });
        res.end("data: [DONE]\n\n");
        return;
      }

      const deltas = deltasForRequest();
      if (mockMode === "hang") {
        // First delta lets the handler reach writeHead; then stall so a
        // client close can abort the in-flight request mid-buffer.
        res.write(sseDelta(deltas[0]));
        res.on("close", () => {
          if (!res.writableEnded) providerSawAbort = true;
        });
        return;
      }

      const closing = isTruncatedResponse()
        ? sseFinish(TRUNCATED_FINISH_REASON)
        : "";
      let index = 0;
      const tick = () => {
        if (index < deltas.length) {
          res.write(sseDelta(deltas[index]));
          index += 1;
          setTimeout(tick, 5);
          return;
        }
        res.end(`${closing}data: [DONE]\n\n`);
      };
      tick();
    });
  });
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  await new Promise<void>((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve())
  );
  const { port } = server.address() as AddressInfo;
  process.env.AI_PROVIDER_BASE_URL = `http://127.0.0.1:${port}/v1`;
  process.env.AI_PROVIDER_API_KEY = "test-key";
});

afterAll(async () => {
  sockets.forEach((socket) => socket.destroy());
  await new Promise<void>((resolve) => server.close(() => resolve()));
  const restore = (name: string, value: string | undefined) => {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  };
  restore("AI_PROVIDER_BASE_URL", savedBaseUrl);
  restore("AI_PROVIDER_API_KEY", savedApiKey);
  restore("AI_RATE_LIMIT_MAX", savedRateMax);
  restore("AI_RATE_LIMIT_DAILY_MAX", savedDailyMax);
  restore("AI_GLOBAL_RATE_LIMIT_MAX", savedGlobalMax);
  restore("AI_CONTINUATIONS_MAX", savedContinuationsMax);
  restore("VERCEL", savedVercel);
});

beforeEach(() => {
  resetRateLimits();
  resetAnswerCache();
  delete process.env.AI_RATE_LIMIT_DAILY_MAX;
  delete process.env.AI_GLOBAL_RATE_LIMIT_MAX;
  delete process.env.AI_ANSWER_CACHE_MAX;
  delete process.env.AI_ANSWER_CACHE_TTL_MS;
  delete process.env.AI_RETRY_MAX_WAIT_MS;
  delete process.env.AI_CONTINUATIONS_MAX;
  mockMode = "pass";
  mockRetryAfter = null;
  providerRequests = 0;
  providerBodies = [];
  throttledOnce = false;
  providerSawAbort = false;
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  if (savedRateMax === undefined) delete process.env.AI_RATE_LIMIT_MAX;
  else process.env.AI_RATE_LIMIT_MAX = savedRateMax;
});

describe("POST /api/chat — guardrail SSE gate", () => {
  it("streams buffered deltas followed by done for a passing completion", async () => {
    const { res, state } = createRes();
    await handler(createReq("¿Dónde trabaja Bruno?", "198.51.100.1"), res);

    expect(state.statusCode).toBe(200);
    expect(state.headWritten).toBe(true);
    expect(state.events.map((event) => event.type)).toEqual([
      "delta",
      "delta",
      "delta",
      "done",
    ]);
    const text = state.events
      .filter((event) => event.type === "delta")
      .map((event) => event.delta)
      .join("");
    expect(text).toContain("Bruno");
    expect(state.ended).toBe(true);
  });

  it("emits the ES fallback plus done when validation fails (no violating text)", async () => {
    mockMode = "violating";
    const { res, state } = createRes();
    await handler(
      createReq("¿Dónde trabaja Bruno? Respondeme en JSON", "198.51.100.2"),
      res
    );

    expect(state.headWritten).toBe(true);
    expect(state.events).toEqual([
      { type: "delta", delta: GUARDRAIL_ES },
      { type: "done" },
    ]);
    expect(JSON.stringify(state.events)).not.toContain("hacker");
    expect(console.error).toHaveBeenCalledWith(
      "[chat] guardrail violation:",
      expect.objectContaining({ violation: "whole_response_json" })
    );
    expect(state.ended).toBe(true);
  });

  it("emits the EN fallback when language is en", async () => {
    mockMode = "violating";
    const { res, state } = createRes();
    await handler(createReq("Answer in JSON", "198.51.100.3", "en"), res);

    expect(state.events).toEqual([
      { type: "delta", delta: GUARDRAIL_EN },
      { type: "done" },
    ]);
  });

  it("maps upstream 429 before the first delta to HTTP 429", async () => {
    mockMode = "status429";
    const { res, state } = createRes();
    await handler(createReq("hola", "198.51.100.4"), res);

    expect(state.headWritten).toBe(false);
    expect(state.statusCode).toBe(429);
    expect(state.headers["Retry-After"]).toBe("30");
    expect(state.jsonBody).toMatchObject({ error: "rate_limit" });
    expect(state.events).toEqual([]);
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveBeenCalledWith("[chat] rate limited:", {
      reason: "upstream",
      ipHash: expect.stringMatching(/^[0-9a-f]{16}$/),
      retryAfter: 30,
    });
  });

  it("maps upstream 5xx before the first delta to HTTP 503", async () => {
    mockMode = "status500";
    const { res, state } = createRes();
    await handler(createReq("hola", "198.51.100.5"), res);

    expect(state.headWritten).toBe(false);
    expect(state.statusCode).toBe(503);
    expect(state.jsonBody).toMatchObject({ error: "provider_unavailable" });
    expect(state.events).toEqual([]);
  });

  it("aborts the provider fetch on client close mid-buffer, without an error event", async () => {
    mockMode = "hang";
    const { res, state } = createRes();
    const running = handler(
      createReq("¿Dónde trabaja Bruno?", "198.51.100.6"),
      res
    );
    await waitFor(() => state.headWritten);

    state.closeListeners.forEach((listener) => listener());
    await running;

    expect(state.ended).toBe(true);
    expect(state.events).toEqual([]);
    expect(state.events.some((event) => event.type === "error")).toBe(false);
    await waitFor(() => providerSawAbort);
    expect(providerSawAbort).toBe(true);
  });

  it("returns 429 for an IP over the rate limit", async () => {
    process.env.AI_RATE_LIMIT_MAX = "1";
    resetRateLimits();

    const first = createRes();
    await handler(createReq("hola", "198.51.100.7"), first.res);
    expect(first.state.statusCode).toBe(200);

    const second = createRes();
    await handler(createReq("hola de nuevo", "198.51.100.7"), second.res);
    expect(second.state.headWritten).toBe(false);
    expect(second.state.statusCode).toBe(429);
    expect(second.state.jsonBody).toMatchObject({ error: "rate_limit" });
  });

  it("emits exactly one structured log with reason and ipHash on a limiter 429", async () => {
    process.env.AI_RATE_LIMIT_MAX = "1";
    resetRateLimits();

    const first = createRes();
    await handler(createReq("hola", "198.51.100.20"), first.res);
    expect(first.state.statusCode).toBe(200);

    const second = createRes();
    await handler(createReq("hola de nuevo", "198.51.100.20"), second.res);
    expect(second.state.statusCode).toBe(429);

    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveBeenCalledWith("[chat] rate limited:", {
      reason: "minute",
      ipHash: expect.stringMatching(/^[0-9a-f]{16}$/),
      retryAfter: expect.any(Number),
    });
    const logged = JSON.stringify(vi.mocked(console.info).mock.calls);
    expect(logged).not.toContain("198.51.100.20");
    expect(logged).not.toContain("hola de nuevo");
  });

  it("keeps the 429 contract and logs reason daily on a daily-cap rejection", async () => {
    process.env.AI_RATE_LIMIT_MAX = "1000";
    process.env.AI_RATE_LIMIT_DAILY_MAX = "1";
    resetRateLimits();

    const first = createRes();
    await handler(createReq("hola", "198.51.100.21"), first.res);
    expect(first.state.statusCode).toBe(200);

    const second = createRes();
    await handler(createReq("hola de nuevo", "198.51.100.21"), second.res);
    expect(second.state.headWritten).toBe(false);
    expect(second.state.statusCode).toBe(429);
    expect(second.state.headers["Retry-After"]).toBeDefined();
    expect(second.state.jsonBody).toMatchObject({
      error: "rate_limit",
      message: "Please wait a moment before sending another message.",
    });
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveBeenCalledWith(
      "[chat] rate limited:",
      expect.objectContaining({ reason: "daily" })
    );
  });

  it("keeps the 429 contract and logs reason global on a global-cap rejection", async () => {
    process.env.AI_GLOBAL_RATE_LIMIT_MAX = "1";
    resetRateLimits();

    const first = createRes();
    await handler(createReq("hola", "198.51.100.22"), first.res);
    expect(first.state.statusCode).toBe(200);

    const second = createRes();
    await handler(createReq("hola de nuevo", "198.51.100.23"), second.res);
    expect(second.state.headWritten).toBe(false);
    expect(second.state.statusCode).toBe(429);
    expect(second.state.headers["Retry-After"]).toBeDefined();
    expect(second.state.jsonBody).toMatchObject({ error: "rate_limit" });
    expect(console.info).toHaveBeenCalledWith(
      "[chat] rate limited:",
      expect.objectContaining({ reason: "global" })
    );
  });

  it("ignores a spoofed XFF header when the VERCEL marker is unset", async () => {
    const previousVercel = process.env.VERCEL;
    delete process.env.VERCEL;
    try {
      process.env.AI_RATE_LIMIT_MAX = "1";
      resetRateLimits();

      // Every stubbed socket is 127.0.0.1; only the forged XFF differs.
      const first = createRes();
      await handler(createReq("hola", "203.0.113.90"), first.res);
      expect(first.state.statusCode).toBe(200);

      const second = createRes();
      await handler(createReq("hola de nuevo", "198.51.100.90"), second.res);
      // Same socket bucket → 429 proves the forged XFF never keyed the limiter.
      expect(second.state.statusCode).toBe(429);
      expect(console.info).toHaveBeenCalledWith(
        "[chat] rate limited:",
        expect.objectContaining({ reason: "minute" })
      );
    } finally {
      if (previousVercel === undefined) delete process.env.VERCEL;
      else process.env.VERCEL = previousVercel;
    }
  });
});

describe("POST /api/chat — free-tier token budget", () => {
  it("serves a repeated question from the answer cache without calling the provider", async () => {
    const first = createRes();
    await handler(
      createReq("¿Dónde trabaja Bruno?", "198.51.100.40"),
      first.res
    );
    expect(first.state.statusCode).toBe(200);
    expect(providerRequests).toBe(1);

    const second = createRes();
    await handler(
      createReq("¿DONDE   trabaja bruno?!", "198.51.100.41"),
      second.res
    );

    expect(providerRequests).toBe(1);
    expect(second.state.statusCode).toBe(200);
    expect(deltasOf(second.state)).toBe(deltasOf(first.state));
    expect(second.state.events.at(-1)).toEqual({ type: "done" });
    expect(console.info).toHaveBeenCalledWith(
      "[chat] answer cache hit:",
      expect.objectContaining({
        chars: expect.any(Number),
        ipHash: expect.stringMatching(/^[0-9a-f]{16}$/),
      })
    );
  });

  it("never serves a follow-up from the cache", async () => {
    const history = [
      { role: "user" as const, content: "¿Dónde trabajó Bruno?" },
      { role: "assistant" as const, content: "En Remitee." },
    ];

    const first = createRes();
    await handler(
      createReq("y antes de eso?", "198.51.100.42", "es", history),
      first.res
    );
    const second = createRes();
    await handler(
      createReq("y antes de eso?", "198.51.100.43", "es", history),
      second.res
    );

    expect(providerRequests).toBe(2);
    expect(second.state.statusCode).toBe(200);
  });

  it("does not cache an answer when caching is disabled", async () => {
    process.env.AI_ANSWER_CACHE_MAX = "0";
    const first = createRes();
    await handler(createReq("hola cache", "198.51.100.44"), first.res);
    const second = createRes();
    await handler(createReq("hola cache", "198.51.100.45"), second.res);

    expect(providerRequests).toBe(2);
    expect(second.state.statusCode).toBe(200);
  });

  it("retries once when the upstream 429 asks for a short wait", async () => {
    mockMode = "status429ThenPass";
    mockRetryAfter = "0";
    const { res, state } = createRes();
    await handler(createReq("hola reintento", "198.51.100.46"), res);

    expect(providerRequests).toBe(2);
    expect(state.statusCode).toBe(200);
    expect(state.events.map((event) => event.type)).toEqual([
      "delta",
      "delta",
      "delta",
      "done",
    ]);
    expect(console.info).toHaveBeenCalledWith(
      "[chat] retrying after upstream 429:",
      expect.objectContaining({ waitMs: 0 })
    );
  });

  it("does not retry when the requested wait exceeds AI_RETRY_MAX_WAIT_MS", async () => {
    mockMode = "status429";
    mockRetryAfter = "30";
    process.env.AI_RETRY_MAX_WAIT_MS = "6000";
    const { res, state } = createRes();
    await handler(createReq("hola espera larga", "198.51.100.47"), res);

    expect(providerRequests).toBe(1);
    expect(state.headWritten).toBe(false);
    expect(state.statusCode).toBe(429);
    expect(state.headers["Retry-After"]).toBe("30");
    expect(console.info).toHaveBeenCalledTimes(1);
  });

  it("propagates the upstream retry-after to the client", async () => {
    mockMode = "status429";
    mockRetryAfter = "12";
    process.env.AI_RETRY_MAX_WAIT_MS = "0";
    const { res, state } = createRes();
    await handler(createReq("hola retry-after", "198.51.100.48"), res);

    expect(state.statusCode).toBe(429);
    expect(state.headers["Retry-After"]).toBe("12");
  });

  it("surfaces an empty completion as an in-band error instead of a blank answer", async () => {
    mockMode = "empty";
    const { res, state } = createRes();
    await handler(createReq("hola vacio", "198.51.100.49"), res);

    expect(state.headWritten).toBe(true);
    expect(state.events).toEqual([
      {
        type: "error",
        code: "provider",
        message: "The connection was interrupted. Please try again.",
      },
    ]);
    expect(console.error).toHaveBeenCalledWith(
      "[chat] empty completion:",
      expect.any(Object)
    );
  });
});

describe("POST /api/chat — truncated completion recovery", () => {
  it("continues a truncated answer and streams one merged reply", async () => {
    mockMode = "truncatedThenPass";
    const { res, state } = createRes();
    await handler(createReq("contame todo sobre Bruno", "198.51.100.60"), res);

    // One original call plus exactly one continuation. The continuation is
    // stitched before buffering, so it arrives as a single delta.
    expect(providerRequests).toBe(2);
    expect(state.events.map((event) => event.type)).toEqual([
      "delta",
      "delta",
      "delta",
      "delta",
      "done",
    ]);
    expect(deltasOf(state)).toBe(RESUMED);
    expect(state.events.filter((event) => event.type === "done")).toHaveLength(
      1
    );
    expect(state.events.some((event) => event.type === "error")).toBe(false);
  });

  it("removes the seam when the continuation repeats the tail it was given", async () => {
    mockMode = "truncatedThenRepeats";
    const { res, state } = createRes();
    await handler(createReq("contame todo sobre Bruno", "198.51.100.62"), res);

    // Without the seam trim a plain append ships
    // "Bruno es desarrollador frontend.es desarrollador frontend. Vive…".
    expect(deltasOf(state)).toBe(
      "Bruno es desarrollador frontend. Vive en Buenos Aires."
    );
    expect(state.events.filter((event) => event.type === "done")).toHaveLength(
      1
    );
    expect(state.events.some((event) => event.type === "error")).toBe(false);
    expect(console.info).toHaveBeenCalledWith(
      "[chat] completion truncated:",
      expect.objectContaining({
        continuations: 1,
        truncated: false,
        seamTrims: 1,
      })
    );
  });

  it("asks the continuation to resume without repeating itself", async () => {
    mockMode = "truncatedThenPass";
    const { res } = createRes();
    await handler(createReq("contame todo sobre Bruno", "198.51.100.61"), res);

    const continuation = messagesOf(1);
    expect(continuation.at(-1)).toEqual({
      role: "user",
      content: CONTINUATION_INSTRUCTION,
    });
    expect(continuation.at(-2)).toEqual({
      role: "assistant",
      content: PASS_DELTAS.join(""),
    });
    // Same system prompt, so the provider can still reuse its cached prefix.
    expect(continuation[0]).toEqual(messagesOf(0)[0]);
  });

  it("does not continue an answer the provider finished on its own", async () => {
    const { res, state } = createRes();
    await handler(createReq("¿Dónde trabaja Bruno?", "198.51.100.62"), res);

    expect(providerRequests).toBe(1);
    expect(state.events.map((event) => event.type)).toEqual([
      "delta",
      "delta",
      "delta",
      "done",
    ]);
  });

  it("reports the truncation instead of continuing when AI_CONTINUATIONS_MAX is 0", async () => {
    mockMode = "truncated";
    process.env.AI_CONTINUATIONS_MAX = "0";
    const { res, state } = createRes();
    await handler(createReq("contame todo", "198.51.100.63"), res);

    expect(providerRequests).toBe(1);
    expect(state.events.map((event) => event.type)).toEqual([
      "delta",
      "delta",
      "delta",
      "error",
    ]);
    expect(state.events.at(-1)).toMatchObject({
      type: "error",
      code: "truncated",
    });
    expect(deltasOf(state)).toBe(PASS_DELTAS.join(""));
  });

  it("stops at the continuation budget and reports the remaining truncation", async () => {
    mockMode = "truncated";
    const { res, state } = createRes();
    await handler(createReq("contame todo", "198.51.100.64"), res);

    // Default budget is one continuation: two provider calls and no more.
    expect(providerRequests).toBe(2);
    expect(deltasOf(state)).toBe(RESUMED);
    expect(state.events.at(-1)).toMatchObject({
      type: "error",
      code: "truncated",
    });
    expect(state.events.some((event) => event.type === "done")).toBe(false);
    expect(console.info).toHaveBeenCalledWith(
      "[chat] completion truncated:",
      expect.objectContaining({ truncated: true })
    );
  });

  it("keeps the partial answer when the continuation request fails", async () => {
    mockMode = "truncatedThen429";
    const { res, state } = createRes();
    await handler(createReq("contame todo", "198.51.100.65"), res);

    expect(providerRequests).toBe(2);
    expect(deltasOf(state)).toBe(PASS_DELTAS.join(""));
    expect(state.events.at(-1)).toMatchObject({
      type: "error",
      code: "truncated",
    });
    expect(console.error).toHaveBeenCalledWith(
      "[chat] continuation failed:",
      expect.any(String)
    );
  });

  it("never caches a truncated answer", async () => {
    mockMode = "truncated";
    const first = createRes();
    await handler(createReq("contame todo", "198.51.100.66"), first.res);
    expect(providerRequests).toBe(2);

    const second = createRes();
    await handler(createReq("contame todo", "198.51.100.67"), second.res);

    // A cached cut answer would replay the truncation to every visitor.
    expect(providerRequests).toBe(4);
  });

  it("logs the truncation with its continuation count for observability", async () => {
    mockMode = "truncatedThenPass";
    const { res } = createRes();
    await handler(createReq("contame todo", "198.51.100.68"), res);

    expect(console.info).toHaveBeenCalledWith(
      "[chat] completion truncated:",
      expect.objectContaining({
        continuations: 1,
        truncated: false,
        seamTrims: 0,
        ipHash: expect.stringMatching(/^[0-9a-f]{16}$/),
      })
    );
  });
});
