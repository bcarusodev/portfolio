# SDD Technical Design: AI Chat Agent for Portfolio

## Status: Implemented (as-built)

## Version: 1.1 — synced to the shipped implementation (2026-10-12)

## Project: portfolio (C:\Projects\portfolio)

> **Revision note**: v1.0 was written during the design phase and described an
> earlier proposal (floating widget, `llama-3.1-8b-instant`, 30 req/day,
> provider SDKs, `{token}`/`[DONE]` SSE frames, `knowledge-base.ts` /
> `system-prompt.ts`). This revision records what actually shipped at commit
> `e46225b` (`feat/conversational-chat`), per verify finding V-03.

---

## 1. Component Architecture

### Overview

The chat widget is an **inline**, ChatGPT-style panel rendered on the Home page
below the hero CTAs, inside the content column (`max-w-[860px]`, centered). It is
**not** a floating/fixed overlay (spec FR-01/U-01 superseded the proposal's
bottom-right widget). Components follow Atomic Design: molecules in
`src/components/Molecules/ChatWidget/`.

The widget is loaded with `next/dynamic` + `ssr: false`, so its chunk stays out
of the initial load and never hydrates on the server (NFR-01).

### ChatWidget (index.tsx) — Main Orchestrator

**Location**: `src/components/Molecules/ChatWidget/index.tsx` (default export)
**Type**: Pages Router client component (no `"use client"` directive — that is an
App Router convention; this project is Pages Router).
**Responsibility**: Own conversation state, drive the SSE streaming fetch, render
header (title + ES/EN toggle + "New chat"), error banner, and the sub-components.

**Props**:

```typescript
interface IChatWidgetProps {
  className?: string;
}
```

Feature gating (`NEXT_PUBLIC_AI_CHAT_ENABLED`) is applied by the parent page,
not by widget props.

**State**:

```typescript
messages: IChatMessage[];      // full conversation
status: IChatStatus;           // "idle" | "thinking" | "streaming" | "error"
errorCode: IChatErrorCode | null; // rate_limit|network|provider|invalid|too_long|truncated|unknown
input: string;                 // controlled textarea value
language: ILang;               // "es" | "en"
```

**Message shape** (`types.ts`):

```typescript
interface IChatMessage {
  id: string; // crypto.randomUUID() with Date.now fallback (es5-safe)
  role: "user" | "assistant";
  content: string; // accumulated during streaming
}
```

**Behavior**:

- On mount: language from `localStorage` key `chat-lang:v1`, else
  `navigator.language.startsWith("es") ? "es" : "en"`.
- On send: append user message, `POST /api/chat` with
  `{ message, history, language }` (`history` = last 8 role/content pairs),
  stream deltas into a new assistant message.
- Streaming: `AbortController` (aborted on unmount, "New chat", or retry);
  frames split on `\n\n`; deltas coalesced into React state every 50 ms.
- Guards: empty input blocked, >2000 chars → `too_long`, 300 ms resend guard.
- Retry: re-sends the last user message after dropping a partial assistant
  bubble (E-01).
- Error: inline `role="alert"` banner with localized copy, Retry + Dismiss.

### MessageList.tsx

```typescript
interface IMessageListProps {
  messages: IChatMessage[];
  status: IChatStatus;
  language: ILang;
}
```

Renders the log (`role="log"`, `aria-live="polite"`, NFR-05), empty-state hint,
smooth `scrollTo` on new messages (U-05), and typing dots while `thinking` — or
while `streaming` before the first token lands (FR-10, U-06).

### MessageInput.tsx

```typescript
interface IMessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean; // true while thinking/streaming
  language: ILang;
  maxLength?: number; // default 2000
}
```

Auto-growing `<textarea>` (capped at 140 px ≈ 5 rows), Enter to send,
Shift+Enter newline (IME-safe), character counter, send disabled when empty,
busy, or over limit (E-03/E-04). ARIA: `inputLabel`, `aria-invalid` over limit.

### MessageBubble.tsx

```typescript
interface IMessageBubbleProps {
  message: IChatMessage;
  language: ILang;
  isTyping?: boolean; // renders TypingDots instead of content
}
```

User messages right-aligned (`bg-primary`/`text-primary-foreground`), assistant
messages left-aligned (`bg-muted`, `border-border/60`) — theme tokens inherit
dark/light mode via next-themes (FR-09). Framer Motion fade+slide on entrance.

### labels.ts / types.ts

`labels.ts` holds the full ES/EN UI dictionaries (`getLabels(language)`);
answer language is handled server-side by the system prompt, not by the labels.
`types.ts` shares `ILang`, `IChatMessage`, `IChatStatus`, `IChatErrorCode`
between the components without circular imports.

---

## 2. API Route Design

### Route File

**Location**: `src/pages/api/chat.ts` — standard Pages Router API route
(`NextApiRequest` / `NextApiResponse`), registered as `ƒ /api/chat` (dynamic).

### Request Body

```typescript
{ message: string; history?: Array<{ role: "user" | "assistant"; content: string }>; language?: "es" | "en" }
```

Inline validation (no Zod dependency):

| Condition                            | Status              | Body                                        |
| ------------------------------------ | ------------------- | ------------------------------------------- |
| Method ≠ POST                        | 405 + `Allow: POST` | `{"error":"method_not_allowed"}`            |
| Empty/whitespace message             | 400                 | `{"error":"empty_message",...}`             |
| Message > 2000 chars                 | 400                 | `{"error":"message_too_long",...}`          |
| IP over rate window                  | 429 + `Retry-After` | `{"error":"rate_limit",...,"retryAfter":N}` |
| KB file missing / unparsable         | 503                 | `{"error":"knowledge_unavailable",...}`     |
| Provider misconfigured / unknown key | 503                 | `{"error":"provider_unavailable",...}`      |

`history` is sanitized (only `{role,content}` pairs with string content) and
trimmed to the last 6 messages / ≤800 tokens by `trimHistory()`.

### SSE Streaming

The route **pulls the first delta before opening the stream**, so upstream
failures still map to real HTTP status codes (429/503) instead of a 200 with an
in-band error (FR-15/FR-16). After that:

```typescript
res.writeHead(200, {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no", // defeats proxy buffering
});
res.write(`data: ${JSON.stringify(event)}\n\n`);
(res as { flush?: () => void }).flush?.();
```

**Event format** (typed union, not the v1.0 `{token}`/`[DONE]` sketch):

```typescript
type IChatEvent =
  | { type: "delta"; delta: string }
  | { type: "done" }
  | {
      type: "error";
      code: "rate_limit" | "provider" | "invalid" | "truncated";
      message: string;
    };
```

Mid-stream failures send an in-band `error` event, then the stream ends.
`res.on("close")` aborts the provider request when the client disconnects.

### Rate Limiting

**Location**: `src/lib/ai/rateLimit.ts` — in-memory sliding window per IP.

```typescript
// Defaults: 30 requests per IP per 60 s (the Groq free-tier RPM).
AI_RATE_LIMIT_MAX = 30;
AI_RATE_LIMIT_WINDOW_MS = 60000;
```

Timestamps are stored per IP in a `Map`, swept when it exceeds 5000 tracked IPs.
Over-limit responses carry `Retry-After: <seconds until oldest entry expires>`.
State is per-process: it resets on redeploy and is per-instance on serverless.

### Provider Adapter

**Location**: `src/lib/ai/provider.ts` (single file — the v1.0
`providers/{types,openai-compatible,groq,cerebras,index}.ts` split was
consolidated during apply; behavior is identical).

```typescript
export interface IProviderAdapter {
  streamChat(request: {
    system: string;
    messages: IProviderMessage[];
    maxTokens: number;
    signal: AbortSignal;
  }): AsyncGenerator<string>;
}

export class ProviderError extends Error {
  readonly status?: number; // upstream HTTP status → 429/503 mapping
  readonly retryAfterMs?: number; // upstream retry-after, when it sent one
}
```

- **Zero new dependencies**: the client is native `fetch` against the
  OpenAI-compatible `POST {baseUrl}/chat/completions` with `stream: true`, and a
  hand-rolled `data:` SSE parser (`parseDelta`) yielding `choices[0].delta.content`.
- `getProvider()` resolves config from `NEXT_PUBLIC_AI_PROVIDER` (default
  `groq`); unknown keys throw `ProviderError` → route answers 503.
- Auth header from the server-only `AI_PROVIDER_API_KEY`.
- `AI_MODEL` overrides the config default; `AI_PROVIDER_BASE_URL` overrides the
  endpoint (proxies / local mock harness).
- `parseRetryAfter()` turns the upstream `retry-after` (seconds or HTTP-date)
  into `retryAfterMs`; the route uses it to decide whether a retry is worth it
  and what to send back in `Retry-After`.
- Groq sends `reasoning_effort: "low"` by default (`AI_REASONING_EFFORT`
  overrides it; unsupported values drop the field). gpt-oss spends reasoning
  tokens out of `max_completion_tokens` and counts them against the free-tier
  budget, and this assistant needs almost no reasoning.

---

## 3. Provider Selection

### Shipped choice: **Groq**, model **`openai/gpt-oss-120b`**

| Provider | Free tier                              | Rate limits               | Notes                                                                                     |
| -------- | -------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| **Groq** | Yes — free API key, no card, no expiry | ~30 RPM / 1K RPD / 8K TPM | OpenAI-compatible wire protocol, prompt caching exempt from rate limits                   |
| Cerebras | Effectively no                         | —                         | $5 credits expire in 30 days and require a payment method; config entry kept for swapping |
| OpenAI   | No                                     | —                         | Credits expire; config entry kept for swapping                                            |

**Model ID gotcha (verify finding V-01, fixed)**: Groq model IDs require the
vendor namespace — the correct ID is `openai/gpt-oss-120b`. The bare
`gpt-oss-120b` returns `404 model_not_found` and would 503 every chat request.
Defaults now live in `provider.ts` (`defaultModel: "openai/gpt-oss-120b"`) and
`.env.example` (`AI_MODEL=openai/gpt-oss-120b`).

**Fallback plan**: the factory + shared OpenAI-compatible client make a provider
swap an env change (`NEXT_PUBLIC_AI_PROVIDER`, `AI_PROVIDER_API_KEY`,
optionally `AI_MODEL`/`AI_PROVIDER_BASE_URL`) with no code change.

---

## 4. Knowledge Base Integration

### Loading Strategy

**Location**: `src/lib/ai/knowledge.ts`

```typescript
getKnowledgeBase(): IKnowledgeBase; // reads assets/agent-knowledge/knowledge-base-complete.md once per process; throws if missing → route 503
estimateTokens(text): number;        // conservative chars/4 estimate
selectKnowledge(query, maxTokens?): IKBSelection; // "auto mode"
```

The KB is read once at module-level cache (NFR-02); no per-request fs reads.

### Auto Mode (token budget)

The free tier is ~8K TPM / 200K TPD, and the full KB is ~9.3K tokens — shipping
the full KB on every request would 429. `selectKnowledge()` therefore:

1. Returns the **full KB** when `estimateTokens(raw) + index ≤ maxTokens`
   (`AI_MAX_KB_TOKENS`, default 2500).
2. Otherwise it assembles, in this order:
   - the **heading index** (always, so the model can say "I don't have that
     info" instead of hallucinating — FR-21);
   - the **pinned identity core** (`AI_KB_CORE_SECTIONS`, default
     `Identity,Elevator Pitch,Current Role`, ~300 tokens) so a greeting or an
     off-topic question still gets a grounded identity;
   - **keyword-ranked chunks** filling the rest of the budget.
3. Chunks are the smallest retrievable unit: a `###` subsection, or a `##`
   section that carries its own body. Ranking matches accent-normalized
   keywords against the chunk body, its heading (×3) and its parent heading
   (×2), stop-words removed for both ES and EN. Consecutive level-3 chunks
   render under one `## Parent` heading.
4. With no keyword overlap the fallback is document order (Bio first, then
   experience), so greetings still get grounded context.
5. `## System Prompt Context` is retrieval-excluded: it duplicates the
   guardrail instructions already in `prompt.ts`.

The index and the pinned core are **byte-identical for every query**, which is
what makes the provider's automatic prompt caching (Groq: cached tokens do not
count towards rate limits) hit on that prefix. Only the retrieved chunks and
the optional language hint vary.

Chunk retrieval replaced whole-`##` selection: the old `## Work Experience`
section alone was 4,144 tokens, so a single "experience" question consumed the
entire per-minute budget.

### System Prompt Construction

**Location**: `src/lib/ai/prompt.ts` — `buildSystemPrompt({ selection, language })`

Assembles: fixed guardrail instructions (~706 tokens, 12 rules covering scope,
polite redirect, NDA refusal, "don't have that info", same-language replies,
answer-length discipline, portfolio page suggestions, "never Bruno himself") +
`KNOWLEDGE
BASE:` + the selected content + the optional language hint **last** (only a
fallback when the message language is ambiguous — the model auto-detects
ES/EN). The hint is last on purpose: it varies per visitor, so keeping it out
of the prefix preserves the cacheable part of the prompt.

`trimHistory(history, maxMessages = 6, maxTokens = 800)` keeps requests inside
the history budget; a long chat can no longer inflate every request.

### Request Token Budget

| Segment                 | Cap                                |
| ----------------------- | ---------------------------------- |
| Instructions            | ~706 tok                           |
| KB index + pinned core  | ~665 tok (cacheable prefix)        |
| KB retrieved chunks     | ≤ ~1,835 (AI_MAX_KB_TOKENS 2,500)  |
| History (last 6)        | ≤ 800                              |
| `max_completion_tokens` | 1,000 (including reasoning tokens) |
| **Request target**      | **≤ ~5K**                          |

Groq's HTTP 413 `rate_limit_exceeded` (raised when `prompt + declared cap`
exceeds the 8K TPM window) confirms the declared cap takes part in **admission**.
How it takes part in **accounting** is not established, and the earlier reading
here — "Groq debits `prompt + max_completion_tokens` as declared" — must not be
repeated: it came from a request that was truncated _at_ its cap, so declared and
actual were the same number. A later probe (tiny prompt, `cap 700`) reported 619
window tokens consumed for a request whose actual usage was 102 and whose
prompt+cap was 783, matching neither. The cap is sized from the answer-length
distribution instead, because a continuation re-sends the whole prompt (~2.8K)
and therefore costs far more than a comfortably larger cap.

Raw requests are ≤ ~5K; the metered figure is lower because cached tokens are
excluded from the rate limits (the KB index + core prefix above is byte-stable
across visitors), and the answer cache serves repeats at zero upstream cost.

### Answer Cache

**Location**: `src/lib/ai/answerCache.ts`

The same handful of questions arrives over and over on a portfolio, so a
repeated question is served from memory and costs **zero** upstream tokens:

- Key: canonicalized question (lowercase, accent-free, punctuation-free,
  whitespace-collapsed) + guardrail language.
- Only **history-less** questions are eligible: a follow-up depends on the
  turns before it and must not be replayed out of context.
- Only guardrail-validated text is stored, and a hit is re-validated before it
  is served.
- Bounded by `AI_ANSWER_CACHE_MAX` (default 50; `0` disables) and
  `AI_ANSWER_CACHE_TTL_MS` (default 900000 = 15 min).
- Process-local, like the rate limiter: it resets on redeploy and is not shared
  between instances.

### Upstream 429 Recovery

A per-minute 429 resets in seconds, so the route waits instead of failing when
that is cheap: `openStream()` retries **once**, only before the stream opens (no
half-written answer) and only when the provider's `retry-after` is at most
`AI_RETRY_MAX_WAIT_MS` (default 6000). The wait is abortable, so a client that
disconnects mid-retry releases the handler. When the hint is longer than the cap
(or absent) the request fails fast with the upstream value propagated in
`Retry-After`.

An empty completion (a reasoning model spending the whole cap on reasoning) is
reported as an in-band `error` event instead of a blank bubble.

### Truncated Completion Recovery

`finish_reason` is the only signal that separates a finished answer from one the
provider cut off at `max_completion_tokens`, so `streamChat()` returns it as its
generator's terminal value (`IStreamFinish`) and the route acts on it.

Measured on the free tier, `AI_MAX_COMPLETION_TOKENS: 480` returned
`finish_reason: "length"` with `completion_tokens: 480` — and 32 of those were
reasoning tokens, so a `reasoning_effort: "low"` answer only got ~448 tokens of
visible text. The same prompt with a 2,000 cap finished on its own at 435
tokens, which is the point: 480 sat _inside_ the natural answer-length
distribution, so truncation looked random and a full answer was unreachable.

When a completion ends at the cap the route calls the provider again with the
partial answer appended as an `assistant` turn plus `CONTINUATION_INSTRUCTION`
(`prompt.ts`) as a synthetic `user` turn, and merges both into the same SSE
reply — the visitor sees one continuous answer, not a continuation request.
Constraints that matter:

- The instruction travels as a **message**, never in the system prompt, or it
  would break the byte-stable prefix the provider caches.
- The continuation reuses the same system prompt for the same reason.
- `AI_CONTINUATIONS_MAX` (default 1, `0` disables) bounds the extra upstream
  calls; each one is another real request against RPD and the TPM window.
- A continuation that fails keeps the partial answer and reports the
  truncation (`[chat] continuation failed:`); the partial text is more useful
  than an error alone.
- A truncated answer is **never** written to the answer cache — replaying a cut
  answer to every visitor would make the defect sticky.
- **The seam is stitched, not trusted.** The provider usually re-emits the words
  around the cut before resuming: measured live, the partial ended
  `…servidores de juego, bases de datos ligeras para` and the continuation
  reopened with `bases de datos ligeras para almacenar…`, so a plain append
  shipped `…bases de datos ligeras parabases de datos ligeras para…`.
  `trimSeamOverlap()` (`provider.ts`) drops the longest repeated word run that is
  also a prefix of the continuation, requires at least 16 characters, keeps the
  separator that followed it verbatim, and returns the remainder ready to append.
  A single repeated word at the boundary therefore survives as content instead of
  being silently deleted.
- If the truncation survives the budget the route emits
  `{type:"error", code:"truncated"}` after the partial deltas instead of a
  `done` that would present half an answer as complete. It also logs
  `[chat] completion truncated:` with the continuation count and the number of
  seams trimmed, so the real truncation rate is measurable rather than inferred.

---

## 5. Streaming Implementation

### Backend

`chat.ts` iterates the provider's `AsyncGenerator<string, IStreamFinish>` and
writes one SSE event per delta (see Section 2). Headers include `no-transform`
and `X-Accel-Buffering: no` so proxies do not buffer the stream. Because the
answer is buffered until validation passes, a truncated answer is continued
_before_ anything reaches the client: the merge is invisible to the transport.

### Frontend

`ChatWidget/index.tsx` uses `fetch` + `response.body.getReader()` (not
`EventSource`, which cannot POST):

1. Append decoded bytes to a buffer; split frames on `\n\n`.
2. Parse each `data:` line as JSON `{ type, delta?, code? }`.
3. Accumulate `delta` text in a pending string; flush to React state at most
   every 50 ms (avoids render storms on fast streams).
4. `type: "done"` marks a clean end; a missing `done` is treated as a dropped
   stream (`network` error + retry).
5. `type: "error"` surfaces the in-band error code in the banner.

Verified live: 200 OK, incremental chunks (e.g. 258 chunks over a multi-second
window), correct SSE headers — true streaming, not a single blob.

---

## 6. State Management

| State                                                  | Where                          | Notes                                            |
| ------------------------------------------------------ | ------------------------------ | ------------------------------------------------ |
| `messages`, `status`, `errorCode`, `input`, `language` | ChatWidget local `useState`    | No external store — the widget is self-contained |
| Language preference                                    | `localStorage["chat-lang:v1"]` | Written on every change; read once on init       |
| Conversation history                                   | Memory only                    | Resets on refresh; nothing persisted             |
| In-flight request                                      | `AbortController` ref          | Aborted on unmount / new chat / retry            |

The server independently trims history (last 6 / ≤800 tokens), so a tampered
client cannot inflate requests.

---

## 7. Styling

Inline in the page flow — **no fixed positioning anywhere**:

```tsx
// src/pages/index.tsx
<div className="flex flex-col gap-20 pb-20 items-center">
  {AI_CHAT_ENABLED ? (
    <BlurFade delay={...} inView className="w-full max-w-[860px] mx-auto">
      <ChatWidget />
    </BlurFade>
  ) : null}
  ...
</div>
```

```tsx
// ChatWidget root <section>
"w-full overflow-hidden rounded-2xl border border-border/60 bg-background/90 shadow-lg backdrop-blur";
// Message list
"flex max-h-[420px] min-h-[240px] flex-col gap-3 overflow-y-auto px-4 py-4";
// User bubble / assistant bubble
"bg-primary text-primary-foreground" / "bg-muted border-border/60";
```

- Theme: all colors are theme tokens (`bg-background`, `bg-muted`,
  `border-border`, `text-muted-foreground`, `bg-primary`), so dark/light follow
  the existing next-themes provider (FR-09). No `useTheme()` calls were needed.
- Responsive: `w-full` inside a centered `max-w-[860px]` wrapper; touch targets
  ≥ 44 px on the send/toggle buttons (FR-08).
- Animation: Framer Motion entrance on bubbles; CSS `animate-bounce` typing dots.
- shadcn/ui: `Button` only (no `Textarea` — a plain styled `<textarea>` was
  simpler to auto-size).

---

## 8. Error Handling

| Case                          | Backend                                       | UI                                                                            |
| ----------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| Empty input                   | no request                                    | send disabled (E-03)                                                          |
| >2000 chars                   | 400 `message_too_long`                        | counter turns red; `too_long` banner (E-04)                                   |
| IP over window                | 429 + `Retry-After`                           | `rate_limit` banner + Retry (E-02)                                            |
| Stream drop / no `done`       | in-band `error` event                         | `network` banner + Retry (E-01)                                               |
| Answer cut off at the cap     | continued once, then in-band `error` event    | `truncated` banner + Retry                                                    |
| Provider down / unknown key   | 503 pre-stream                                | `provider` banner + Retry (E-05)                                              |
| KB missing                    | 503 `knowledge_unavailable`                   | `provider` banner (widget stays mounted; the feature flag is the kill switch) |
| Client disconnects pre-stream | 499 (non-standard nginx code; known nit V-06) | n/a                                                                           |

All errors are logged server-side with context; clients receive only localized
user-facing strings from `labels.ts`.

---

## 9. Environment Configuration

Documented in `.env.example` (created during apply — the file did not exist):

```bash
# Feature flag (FR-27) — build-time; widget renders nothing when not "true"
NEXT_PUBLIC_AI_CHAT_ENABLED=false

# Provider key for getProvider(): groq | cerebras | openai (FR-25)
NEXT_PUBLIC_AI_PROVIDER=groq

# Server-only credential — NEVER NEXT_PUBLIC_ prefixed (FR-26)
AI_PROVIDER_API_KEY=

# Optional server-only base-URL override (proxies / local mock)
# AI_PROVIDER_BASE_URL=

# Model override — Groq IDs require the vendor namespace
AI_MODEL=openai/gpt-oss-120b

# Reasoning effort for gpt-oss (low | medium | high). Groq defaults to low
# here: reasoning tokens come out of the same free-tier budget.
# AI_REASONING_EFFORT=low

# KB token budget per request
AI_MAX_KB_TOKENS=2500

# Headings pinned to every request (identity context for greetings).
# Empty value disables the pinned core.
AI_KB_CORE_SECTIONS=Identity,Elevator Pitch,Current Role

# Completion cap (includes gpt-oss reasoning tokens)
AI_MAX_COMPLETION_TOKENS=1000

# Extra calls allowed when the provider stopped at the cap (0 disables)
# AI_CONTINUATIONS_MAX=1

# Answer cache for repeated history-less questions (0 disables)
AI_ANSWER_CACHE_MAX=50
AI_ANSWER_CACHE_TTL_MS=900000

# Retry once after an upstream 429 when its retry-after is at most this long
AI_RETRY_MAX_WAIT_MS=6000

# In-memory per-IP limiter (defaults = Groq free tier)
AI_RATE_LIMIT_MAX=30
AI_RATE_LIMIT_WINDOW_MS=60000
```

FR-26 was verified by scanning all 39 client bundle files: zero key material.

---

## 10. File Structure (as shipped)

```
src/
├── components/
│   └── Molecules/
│       └── ChatWidget/
│           ├── index.tsx          # orchestrator: state, SSE reader, header, error banner
│           ├── MessageList.tsx    # role="log", aria-live, auto-scroll, typing dots
│           ├── MessageInput.tsx   # auto-grow textarea, Enter/Shift+Enter, counter
│           ├── MessageBubble.tsx  # user/assistant bubbles, Framer Motion
│           ├── labels.ts          # ES/EN UI strings
│           └── types.ts           # ILang, IChatMessage, IChatStatus, IChatErrorCode
├── pages/
│   ├── index.tsx                  # dynamic(ssr:false) ChatWidget, flag-gated, below Hero
│   └── api/
│       └── chat.ts                # POST validate → rate limit → KB → SSE stream
└── lib/
    └── ai/
        ├── knowledge.ts           # KB cache, chunk split, ranking, stable prefix, digest
        ├── prompt.ts              # guardrail system prompt + trimHistory
        ├── answerCache.ts         # in-memory TTL cache for repeated questions
        ├── rateLimit.ts           # in-memory per-IP sliding window
        └── provider.ts            # OpenAI-compatible SSE client + getProvider() factory

assets/
└── agent-knowledge/
    └── knowledge-base-complete.md # single source of truth (~9.3K tokens)

.env.example                       # all AI_* / NEXT_PUBLIC_AI_* vars documented
```

Zero new npm dependencies: `fetch` is native; `framer-motion` and `lucide-react`
were already in the project.

### Integration Point

```tsx
// src/pages/index.tsx
const ChatWidget = dynamic(() => import("@/components/Molecules/ChatWidget"), {
  ssr: false,
});
const AI_CHAT_ENABLED = process.env.NEXT_PUBLIC_AI_CHAT_ENABLED === "true";
```

The widget sits directly below `<Hero />` in the centered content column, above
`<Services />` (FR-01, U-01/U-02). Rollback = flip the flag off (or drop the
conditional), no code removal required.

---

## 11. Implementation Phases (completed)

| Phase | Deliverable                                                                                            | Status                       |
| ----- | ------------------------------------------------------------------------------------------------------ | ---------------------------- |
| 1     | `knowledge.ts` + `prompt.ts` (KB cache, auto mode, guardrails)                                         | ✅ T-01, T-02                |
| 2     | `rateLimit.ts`, `provider.ts`, `api/chat.ts` (validate → limit → SSE)                                  | ✅ T-03..T-06                |
| 3     | ChatWidget molecules + `labels.ts`/`types.ts`                                                          | ✅ T-07..T-11                |
| 4     | Flag-gated `next/dynamic` integration in `index.tsx` + `.env.example`                                  | ✅ T-12                      |
| 5     | Verification: `tsc`/`lint`/`build` clean, Node E2E harnesses, live Groq smoke, maintainer browser pass | ✅ automated matrix + manual |

Automated suites cover the provider, prompt, knowledge selection, answer cache and
the `/api/chat` route (`vitest run`, node environment); see §11 for the full matrix.

---

## 12. Risks & Mitigations (as shipped)

| Risk                                             | Mitigation                                                                                                                                                                                                                                                                                                                  | Residual                                                                                                                                                                             |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Free tier exhausted / aggressive upstream limits | App-side 30 RPM/IP limiter with friendly 429 + `Retry-After`; a ≤ ~5K per-request budget inside the 8K TPM window; stable prompt prefix for provider caching (cached tokens are excluded from limits); zero-token answer cache for repeated questions; one bounded retry when the 429 names a wait ≤ `AI_RETRY_MAX_WAIT_MS` | **Reduced** — the daily `TPD` ceiling (~200K, per organisation, shared across every key) remains the hard limit; a second provider/key or the Developer tier is the documented lever |
| Hallucination                                    | KB-only grounding, heading digest, fixed refusal copy, temperature 0.4                                                                                                                                                                                                                                                      | Low — live A-03/A-04/A-05 probes passed                                                                                                                                              |
| Rate limiter per-instance on serverless          | In-memory Map, documented                                                                                                                                                                                                                                                                                                   | Acceptable for a portfolio; swap for Redis if needed                                                                                                                                 |
| SSE buffering behind proxies                     | `no-transform` + `X-Accel-Buffering: no`                                                                                                                                                                                                                                                                                    | Verified live                                                                                                                                                                        |
| Key leakage to client                            | Server-only `AI_PROVIDER_API_KEY`; only `NEXT_PUBLIC_AI_CHAT_ENABLED`/`NEXT_PUBLIC_AI_PROVIDER` are public                                                                                                                                                                                                                  | Verified: 0 leaks in 39 client bundles                                                                                                                                               |
| Client disconnect mid-stream                     | `res.on("close")` → `AbortController.abort()`                                                                                                                                                                                                                                                                               | 499 status is non-standard (V-06, harmless)                                                                                                                                          |

Known non-blocking leftovers from verification: `labels.thinking` is unused —
the typing indicator reuses `labels.typing` (V-05).

---

## Appendix: Key Decisions Summary (as shipped)

1. **Provider**: Groq, model `openai/gpt-oss-120b` (namespace prefix required);
   Cerebras rejected — its free credits expire and need a card.
2. **Adapter**: one OpenAI-compatible `fetch` client in `provider.ts` +
   `getProvider()` factory — zero new dependencies, env-swappable.
3. **Placement**: inline on Home below the hero CTAs, loaded with
   `next/dynamic` `ssr:false`, gated by `NEXT_PUBLIC_AI_CHAT_ENABLED`.
4. **KB strategy**: markdown single source of truth, read once per process;
   "auto mode" full-KB-if-it-fits, else keyword-ranked `##` sections + heading
   digest under a 2.5K token budget (no RAG, no JSON duplicate).
5. **Transport**: POST + SSE frames `{type: delta|done|error}`; first delta is
   pulled before headers so upstream errors map to real status codes.
6. **Rate limiting**: in-memory per-IP sliding window, 30 req/min (not per day).
7. **History**: last 8 messages client-side / last 6 or ≤800 tokens
   server-side; no persistence.
8. **Bilingual**: ES/EN UI dictionaries in `labels.ts` with a toggle; answer
   language auto-detected by the model via the system prompt.
9. **Tests**: `vitest run` (node environment, no jsdom); the AI feature has
   dedicated suites for the provider, prompt, knowledge selection, answer cache
   and the `/api/chat` route, plus `tsc`/`lint`/`build` and a live browser pass.

---

_Synced to the shipped implementation (commit `e46225b`) during the archive phase
of SDD change `ai-agent-portfolio` — portfolio project._
