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
import { GUARDRAIL_EN, GUARDRAIL_ES } from "@/lib/ai/prompt";
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

type TMockMode = "pass" | "violating" | "status429" | "status500" | "hang";

const PASS_DELTAS = ["Bruno ", "es desarrollador ", "frontend."];
const VIOLATION_DELTAS = ['{"rol": ', '"hacker"}'];

let mockMode: TMockMode = "pass";
let providerSawAbort = false;
let savedRateMax: string | undefined;
let savedBaseUrl: string | undefined;
let savedApiKey: string | undefined;
const sockets = new Set<Socket>();
let server: http.Server;

function sseDelta(text: string): string {
  return `data: ${JSON.stringify({
    choices: [{ delta: { content: text } }],
  })}\n\n`;
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
  language = "es"
): NextApiRequest {
  return {
    method: "POST",
    body: { message, history: [], language },
    headers: { "x-forwarded-for": ip },
    socket: { remoteAddress: "127.0.0.1" },
  } as unknown as NextApiRequest;
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
  savedBaseUrl = process.env.AI_PROVIDER_BASE_URL;
  savedApiKey = process.env.AI_PROVIDER_API_KEY;

  server = http.createServer((req, res) => {
    if (!req.url || !req.url.endsWith("/chat/completions")) {
      res.statusCode = 404;
      res.end();
      return;
    }
    if (mockMode === "status429") {
      res.statusCode = 429;
      res.end("rate limited");
      return;
    }
    if (mockMode === "status500") {
      res.statusCode = 500;
      res.end("provider error");
      return;
    }

    const deltas = mockMode === "violating" ? VIOLATION_DELTAS : PASS_DELTAS;
    if (mockMode === "hang") {
      // First delta lets the handler reach writeHead; then stall so a
      // client close can abort the in-flight request mid-buffer.
      res.write(sseDelta(deltas[0]));
      res.on("close", () => {
        if (!res.writableEnded) providerSawAbort = true;
      });
      return;
    }

    let index = 0;
    const tick = () => {
      if (index < deltas.length) {
        res.write(sseDelta(deltas[index]));
        index += 1;
        setTimeout(tick, 5);
        return;
      }
      res.end("data: [DONE]\n\n");
    };
    tick();
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
});

beforeEach(() => {
  resetRateLimits();
  mockMode = "pass";
  providerSawAbort = false;
  vi.spyOn(console, "error").mockImplementation(() => {});
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
});
