# SDD Technical Design: AI Chat Agent for Portfolio

## Status: Proposed

## Version: 1.0

## Project: portfolio (C:\Projects\portfolio)

---

## 1. Component Architecture

### Overview

The chat widget is an embedded, ChatGPT-style interface positioned below the hero CTA buttons ("Explore My Story" and "Projects") on the Home page. Components follow Atomic Design principles — atoms in `src/components/ui/`, molecules in `src/components/Molecules/ChatWidget/`.

### ChatWidget (index.tsx) — Main Orchestrator

**Location**: `src/components/Molecules/ChatWidget/index.tsx`
**Type**: Client Component (`"use client"`)
**Responsibility**: Orchestrate all sub-components, manage conversation state at the widget level (passed down as props), and drive the SSE streaming fetch.

**Props**:

```typescript
interface ChatWidgetProps {
  enabled?: boolean; // toggled via NEXT_PUBLIC_AI_CHAT_ENABLED
  defaultLanguage?: "es" | "en"; // initial language, defaults to browser or "en"
  maxMessages?: number; // safety guard, default 50
}
```

**State**:

```typescript
interface ChatState {
  messages: ChatMessage[]; // full conversation array
  isLoading: boolean; // streaming in progress
  error: string | null; // last error (network, rate limit, provider)
  isThinking: boolean; // provider is generating (first token delay)
  language: "es" | "en"; // active UI + response language
}
```

**Message shape**:

```typescript
interface ChatMessage {
  id: string; // uuid
  role: "user" | "assistant";
  content: string; // full text (accumulated during streaming)
  timestamp: number; // epoch ms
  language?: "es" | "en"; // for UI rendering context
}
```

**Interactions**:

- On mount: load persisted language from `localStorage` (if available).
- On send: append user message, call `/api/chat`, stream tokens into a new assistant message.
- On error: display inline banner; allow retry via button.
- Language toggle: a small selector (ES/EN) updates UI strings and sends `language` in the API body.

### MessageList.tsx

**Location**: `src/components/Molecules/ChatWidget/MessageList.tsx`
**Props**:

```typescript
interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isThinking: boolean;
  error: string | null;
  onRetry: () => void;
}
```

**Responsibility**: Render the full conversation vertically with auto-scroll. Shows a thinking indicator (spinner + "Pienso..." / "Thinking...") when `isThinking && !error`. Shows an error banner when `error` is set. Shows welcome message on empty state.

**Auto-scroll**: `useEffect` watching `messages.length` — scroll to bottom smoothly. Lock to bottom only if already near bottom (avoid yanking scroll when user is reading old messages).

### MessageInput.tsx

**Location**: `src/components/Molecules/ChatWidget/MessageInput.tsx`
**Props**:

```typescript
interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean; // true while streaming
  maxLength?: number; // default 2000 chars
}
```

**Responsibility**: Controlled textarea (shadcn/ui `Textarea`) + send Button. Prevents empty sends. Warns when approaching char limit (show counter). Handles Cmd/Ctrl+Enter to send. Auto-resize textarea up to 5 lines.

**Internal state**: `text: string` (controlled).

### MessageBubble.tsx

**Location**: `src/components/Molecules/ChatWidget/MessageBubble.tsx`
**Props**:

```typescript
interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean; // tailing caret shown for assistant message
}
```

**Responsibility**: Single message rendering. User messages align right (blue gradient bg), assistant messages align left (muted bg matching theme). Uses Framer Motion `motion.div` with `initial`, `animate` for fade+slide-up on mount. Shows typing caret animation when `isStreaming` on the last assistant message.

---

## 2. API Route Design

### Route File

**Location**: `src/pages/api/chat.ts`

Next.js Pages Router uses `src/pages/api/[endpoint].ts` — no route folder nesting needed. This is a Route Handler equivalent in Pages Router; `req`/`res` are standard Node `IncomingMessage`/`ServerResponse`.

### POST Handler Signature

```typescript
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) { ... }
```

### Request Body Schema

```typescript
interface ChatRequest {
  message: string; // latest user input (non-empty, max 2000 chars)
  conversationHistory: ChatMessage[]; // full prior conversation for context
  language: "es" | "en"; // response language
}

// Validation (Zod-like inline)
const bodySchema = {
  message: z.string().min(1).max(2000),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .max(50),
  language: z.enum(["es", "en"]),
};
```

### System Prompt Construction

Loaded once at module init (see Section 4 for KB integration details). The system prompt is assembled from:

1. **Role**: `"You are a professional AI assistant representing Bruno Caruso's portfolio..."` (verbatim from KB system prompt context).
2. **Rules**: 5 rules bullet list copied directly from KB.
3. **Knowledge Base content**: Either full KB or structured extraction (decision in Section 4 — **chosen: structured extraction with token budget, full KB fallback**).
4. **Language directive**: `"Respond in the language the user is using."` appended dynamically per request.

The assembled system prompt is passed as the `system` parameter to the provider, and `conversationHistory` + `message` form the `messages` array in OpenAI-compatible format.

### SSE Streaming Implementation

```typescript
// Node.js res.write() based SSE
res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");
res.setHeader("Connection", "keep-alive");

// For each token chunk from provider:
res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
res.flush?.(); // res.flush() exists in Node/Express; Next.js polyfills via ServerResponse

// On completion:
res.write(`data: [DONE]\n\n`);
res.end();
```

**Key implementation detail**: Use `dev.to/client` approach — the provider (Groq SDK) returns a stream; for each delta, we `res.write()` an SSE event with `{token, ...}` JSON. The `[DONE]` sentinel signals the frontend to stop appending tokens.

### Rate Limiting

**Strategy**: In-memory token bucket per client IP, reset daily.

```typescript
// 30 requests per IP per 24 hours
const rateLimitStore = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 30; // per 24h window
const WINDOW_MS = 86_400_000;
```

- On 429: include `Retry-After` header (seconds until reset) and a friendly JSON body: `{"error": "Límite de consultas alcanzado. Vuelve a intentarlo en ${minutes} minutos.", "retryAfter": seconds}`.

**Rationale**: No external rate limiter (free tier simplicity). IP-based to prevent abuse from a single source. 30/day is generous for portfolio visitors while preventing runaway costs.

### Error Handling

| Scenario                                             | HTTP Status        | Response Body                                                          | Frontend Behavior                                 |
| ---------------------------------------------------- | ------------------ | ---------------------------------------------------------------------- | ------------------------------------------------- |
| Missing API key / misconfigured provider             | 500                | `{"error": "El servicio de chat no está disponible en este momento."}` | Show error banner, retry button hidden            |
| Rate limit exceeded                                  | 429                | `{"error": "Límite de consultas...", "retryAfter": N}`                 | Show rate limit banner with countdown             |
| Provider network error (timeout, connection refused) | 502                | `{"error": "Error de conexión con el proveedor de IA."}`               | Show error banner, retry button                   |
| Invalid request body                                 | 400                | `{"error": "Solicitud inválida."}`                                     | Show generic error (shouldn't happen from our UI) |
| Content filtered / refused by provider               | 403                | `{"error": "Respuesta filtrada. Intenta reformular."}`                 | Show error banner, retry enabled                  |
| Provider returns non-streaming error mid-stream      | 500 (stream abort) | `{"error": "La respuesta falló inesperadamente."}`                     | Clear assistant message, show error               |

All errors log server-side (console.error) with the request IP and error code for debugging. Client receives only user-friendly strings.

### Provider Adapter Pattern

**Location**: `src/lib/ai/provider.ts`

```typescript
export interface AIProvider {
  name: string;
  send(
    systemPrompt: string,
    messages: ProviderMessage[],
    onToken: (token: string) => void
  ): Promise<StreamResult>;
  isAvailable: () => boolean;
}

export interface StreamResult {
  finishReason: "stop" | "length" | "content_filter" | "error";
  usage?: { promptTokens: number; completionTokens: number };
  error?: { code: string; message: string };
}

// Factory function
export function getProvider(): AIProvider {
  const provider = process.env.NEXT_PUBLIC_AI_PROVIDER || "groq";
  switch (provider) {
    case "groq":
      return new GroqProvider();
    case "cerebras":
      return new CerebrasProvider();
    case "openai":
      return new OpenAIProvider();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
```

Each provider subclass implements `AIProvider`. The API route calls `getProvider()` and never imports a specific SDK directly, allowing seamless swapping.

---

## 3. Provider Selection

### Requirements

- **Free tier**: Must have accessible free credits/API without expiry.
- **Streaming**: Must support SSE/streaming token-by-token generation.
- **Performance**: Low latency for conversational UX.
- **Language support**: Spanish and English generation.
- **Reliability**: Uptime acceptable for a portfolio demo.

### Evaluation Matrix

| Provider     | Free Tier                                   | Rate Limit      | Latency                  | Notes                                            |
| ------------ | ------------------------------------------- | --------------- | ------------------------ | ------------------------------------------------ |
| **Groq**     | Yes — free API key, no expiry               | 144k tokens/min | Very low (LPU inference) | Excellent doc, battle-tested SDK, Llama models   |
| **Cerebras** | Yes — free API key, no expiry               | 300k tokens/min | Very low                 | Newer, higher token budget, smaller ecosystem    |
| **OpenAI**   | No — free credits expire after grant period | Varies          | Low                      | Not sustainable; requires constant credit top-up |

### Recommendation: **Groq**

**Primary reason**: The free tier does not expire, streaming is rock-solid with the official SDK, and the developer experience (docs, SDK stability) is the most mature. For a portfolio project that must remain functional without ongoing cost management, Groq is the safest choice.

**Model**: `llama-3.1-8b-instant` — fast, multilingual (Spanish/English), well within free tier limits, and provides good quality for a knowledge-grounded assistant.

**Fallback plan**: The adapter pattern (Section 2) allows an environment variable swap to Cerebras with one code change if Groq becomes unreliable.

---

## 4. Knowledge Base Integration

### Loading Strategy

**Approach**: Load the KB at **module initialization** (first API call triggers lazy load).

```typescript
// src/lib/ai/knowledge-base.ts
let cachedKnowledgeBase: string | null = null;

export function getKnowledgeBase(): string {
  if (cachedKnowledgeBase) return cachedKnowledgeBase;
  const filePath = path.join(
    process.cwd(),
    "assets/agent-knowledge/knowledge-base-complete.md"
  );
  cachedKnowledgeBase = fs.readFileSync(filePath, "utf-8");
  return cachedKnowledgeBase;
}
```

**Rationale**: The KB is static (changes only during content edits, not at runtime). Loading once per server instance is efficient and avoids filesystem reads on every request. Module-level caching in the Node process persists across requests during `next dev` and `next start`.

### System Prompt Construction

```typescript
export function buildSystemPrompt(kb: string, language: "es" | "en"): string {
  const rules = `REGLAS:\n- Only answer using information from this knowledge base\n- Be specific and reference actual projects, companies, and technologies\n- If you don't know something, say "I don't have that specific information..."\n- Respond in the same language the user writes in (Spanish or English)\n- Be conversational but professional\n- When relevant, suggest visiting specific pages of the portfolio\n- Do not speculate — confidentiality applies to some projects`;

  const langDirective =
    language === "es" ? `\n\nResponde en español.` : `\n\nRespond in English.`;

  return `You are Bruno Caruso's AI assistant embedded in his portfolio. Your purpose is to answer questions about Bruno's professional experience, skills, projects, and technical expertise. You ONLY answer questions related to Bruno.\n\n${rules}\n\n## Knowledge Base\n${kb}${langDirective}`;
}
```

### Token Budget Management

The KB is ~675 lines (~9,500 tokens of content). The Llama 3.1 8B context window is 128k tokens — **full KB fits comfortably**.

**Decision: Include the full KB in every request.**

- At ~9.5k tokens, the full KB consumes only ~7.5% of the 128k context window.
- Conversation history (max 50 messages) at ~150 tokens/message = ~7.5k tokens.
- Total system: ~17k tokens — far below limits.
- **No RAG needed** — the simplicity and reliability of full-KB grounding outweighs the marginal cost savings. RAG would introduce retrieval failures and hallucination risk; with grounded-only requirement, full KB is the safest choice.

**Token guard**: If a request would exceed 60k tokens of conversation history, the oldest messages are trimmed (keeping the last 20) before sending.

---

## 5. Streaming Implementation

### Backend: SSE via `res.write()`

```typescript
// src/pages/api/chat.ts
const provider = getProvider();

await provider.send(systemPrompt, messages, (token: string) => {
  res.write(`data: ${JSON.stringify({ token })}\n\n`);
  res.flush?.();
});
res.write(`data: [DONE]\n\n`);
res.end();
```

**Provider SDK streaming**: Each provider subclass uses the SDK's stream (e.g., `groq.chat.completions.create({stream: true, ...})`). The SDK yields `ChoiceDelta` objects; we extract `.content` or `.delta.content` and call `onToken`.

**Chunk parsing**: No manual SSE parsing needed from the provider — the SDK handles OpenAI-compatible streaming. We only translate to frontend SSE format.

**Flushing**: `res.flush()` is a Node.js `ServerResponse` method. In Next.js Pages Router, `res` is the underlying `http.ServerResponse`, so `res.flush()` works when running on Node. On Vercel Edge runtime, SSE works natively. Since we target Node.js runtime, `res.flush()` is available.

### Frontend: ReadableStream / EventSource

```typescript
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message, conversationHistory, language }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder("utf-8");
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });

  // Parse SSE events (data: {...}\n\n)
  const events = buffer.split("\n\n");
  buffer = events.pop() || "";

  for (const event of events) {
    if (event.startsWith("data: ")) {
      const data = event.slice(6);
      if (data === "[DONE]") {
        setIsLoading(false);
        break;
      }
      const { token } = JSON.parse(data);
      // Append token to the assistant message content
      setMessages((prev) => updateLastAssistantMessage(prev, token));
    }
  }
}
```

**State update frequency**: We update React state on every token chunk. For smooth UX without excessive re-renders, we batch using `useReducer` with `flushSync` (React 18) and `startTransition` for non-urgent state. The assistant message `content` string grows with each token.

**Thinking indicator**: Shown via `isThinking` state, set to `true` immediately on request start and set to `false` when the first token arrives (or after a 500ms timeout if no token — shows "Still thinking...").

### Chunk Format

SSE events from our API:

- `data: {"token": "Hello"}` — each token chunk
- `data: {"finishReason": "stop"}` — provider signaled completion
- `data: [DONE]` — stream complete

This simple format avoids needing a full SSE library.

---

## 6. State Management

### Chat State (in ChatWidget component)

| State Variable | Type             | Setter Pattern | React Boundary      |
| -------------- | ---------------- | -------------- | ------------------- |
| `messages`     | `ChatMessage[]`  | `useState`     | Local to ChatWidget |
| `isLoading`    | `boolean`        | `useState`     | Local to ChatWidget |
| `isThinking`   | `boolean`        | `useState`     | Local to ChatWidget |
| `error`        | `string \| null` | `useState`     | Local to ChatWidget |
| `language`     | `"es" \| "en"`   | `useState`     | Local to ChatWidget |

**No external state manager** (no Zustand/Redux). The chat widget is self-contained — it doesn't need to share state with other components. This follows the Vercel rule `rerender-simple-expression-in-memo`: local state is sufficient for isolated interactive UI.

### Conversation History

- **Where**: The full `messages` array lives in `ChatWidget`'s local `useState`.
- **How passed to API**: The `conversationHistory` field in the POST body is `messages.filter(m => m.role !== "system").map(m => ({role, content}))` — strips internal metadata, sends only role+content pairs.
- **No persistence**: Per spec, chat history is NOT persisted. On page refresh, the conversation resets. No `localStorage` for messages.

### Language Preference

- **Storage**: `localStorage` key `chatLanguage` — persisted across sessions for returning visitors.
- **Default**: Browser-detected via `navigator.language.startsWith("es")` → `"es"`, else `"en"`.
- **Update**: The language selector in `MessageInput` calls `setLanguage()` and `localStorage.setItem()`.
- **Passing to API**: `language` field in the POST body, used to construct the system prompt language directive.

### Session Persistence

- **Messages**: None (per spec).
- **Language**: `localStorage` (convenience, not session).
- **Error state**: Cleared on next interaction.

---

## 7. Styling

### Chat Panel (Tailwind classes)

```tsx
// Main container
className = "fixed bottom-6 right-6 z-50 w-full max-w-md";
// Panel
className =
  "flex flex-col h-[500px] bg-background border border-border rounded-xl shadow-2xl overflow-hidden";
// Header
className =
  "flex items-center justify-between p-4 border-b border-border bg-muted/30";
// Messages container
className = "flex-1 overflow-y-auto p-4 space-y-4";
// Input area
className = "flex items-end gap-2 p-4 border-t border-border bg-background";
```

### shadcn/ui Components Used

- `Textarea` (from `src/components/ui/textarea`) — for input.
- `Button` (from `src/components/ui/button`) — send button, retry button.
- `useTheme` from `next-themes` — dark/light detection.

No new shadcn/ui components added — reuse existing ones.

### Theme Support

- Uses existing `ThemeProvider` (from `src/providers/ThemeProvider.tsx`).
- `useTheme()` hook to detect `resolvedTheme`.
- Assistant messages use `bg-muted/30` (adapts to theme automatically).
- User messages use a blue gradient: `bg-gradient-to-r from-blue-500 to-indigo-600 text-white`.
- Borders use `border-border` and `dark:border-white/20` patterns consistent with existing `Button` component.

### Animation (Framer Motion)

```tsx
// MessageBubble.tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
>
  {children}
</motion.div>;
```

**Thinking indicator**: A pulsing ellipsis animation:

```tsx
<motion.div
  animate={{ opacity: [0.4, 1, 0.4] }}
  transition={{ duration: 1.2, repeat: Infinity }}
>
  ···
</motion.div>
```

### Responsive

- **Desktop**: Fixed position `bottom-6 right-6`, max-width `max-w-md`, height `500px`.
- **Mobile**: Full viewport width via `w-[95vw] max-w-md`, height `60vh` (shorter on small screens).
- **Touch targets**: Send button and language selector sized for touch (min 44x44px).

---

## 8. Error Handling

### Network Errors

**Detection**: `fetch()` throws (catch block) or `response.ok === false`.

**UI**: An inline banner at the top of the chat panel (red, `bg-destructive/10 border border-destructive/30`):

```
Error de conexión. No se pudo contactar con el servidor.
[Reintentar]
```

Retry button refetches the current pending message.

### Rate Limits (429)

**UI**: Banner with a countdown timer:

```
Has alcanzado el límite de consultas. Inténtalo de nuevo en 5 minutos.
```

The countdown (`Retry-After` parsed from response) ticks down client-side. Retry button disabled until count reaches 0.

### Provider Downtime

**Detection**: Provider SDK throws `APIError` with `status` or network error code.

**UI**: Same error banner as network errors but with a different message:

```
El modelo de IA no responde. Inténtalo de nuevo en unos minutos.
```

Retry button enabled.

### Empty Messages

**Prevention**: `MessageInput` disables the send button when `text.trim().length === 0`. On the API side, the body schema rejects empty `message` with a 400.

### Long Messages

**Warning**: `MessageInput` shows a character counter (`1800/2000`) that turns amber at 1500 and red at 1800. Send button disabled past 2000.

---

## 9. Environment Configuration

```bash
# .env.local

# Feature flag — client and server can read this (NEXT_PUBLIC prefix)
NEXT_PUBLIC_AI_CHAT_ENABLED=true

# Provider selector — client reads this to choose provider, server uses it for adapter
NEXT_PUBLIC_AI_PROVIDER=groq

# API key — SERVER SIDE ONLY, never exposed to client
GROQ_API_KEY=***
# (alternative if provider changes)
CEREBRAS_API_KEY=***
# (alternative)
OPENAI_API_KEY=***
```

### Runtime Guard

In `ChatWidget/index.tsx`:

```typescript
const ENABLED = process.env.NEXT_PUBLIC_AI_CHAT_ENABLED === "true";
if (!ENABLED) {
  console.log("Chat widget disabled via NEXT_PUBLIC_AI_CHAT_ENABLED");
  return null;
}
```

In `src/pages/api/chat.ts`:

```typescript
const ENABLED = process.env.NEXT_PUBLIC_AI_CHAT_ENABLED === "true";
if (!ENABLED) {
  return res.status(404).json({ error: "Chat endpoint not available." });
}
```

**Security**: API keys (`GROQ_API_KEY`) are in `NEXT_PUBLIC_AI_PROVIDER=...` which the client reads to know the provider name, but the actual API key (`GROQ_API_KEY`) has NO `NEXT_PUBLIC_` prefix and is only available server-side in the API route.

---

## 10. File Structure

```
src/
├── components/
│   └── Molecules/
│       └── ChatWidget/
│           ├── index.tsx              # main widget orchestrator (use client)
│           ├── MessageList.tsx        # scrollable message container
│           ├── MessageInput.tsx       # textarea + send button + language selector
│           └── MessageBubble.tsx      # single message with animation
├── pages/
│   ├── index.tsx                      # embeds ChatWidget below ContactButtons (Hero CTA)
│   └── api/
│       └── chat.ts                    # POST handler, SSE streaming, rate limiting
└── lib/
    └── ai/
        ├── provider.ts                # AIProvider interface, factory, subclasses
        ├── knowledge-base.ts          # KB file loading + caching
        └── system-prompt.ts           # system prompt assembly (rules, KB, language)

assets/
└── agent-knowledge/
    └── knowledge-base-complete.md    # 675 lines, ground truth

.env.local                          # environment variables (gitignored)
```

### Integration Point

In `src/pages/index.tsx`, the `ChatWidget` is placed inside the Hero section, directly below the `ContactButtons` (which contain the CTA buttons "Explore My Story" and "Projects"):

```tsx
// Inside Hero, after ContactButtons
<BlurFade delay={constants.BLUR_FADE_DELAY * 7}>
  <ChatWidget enabled={true} />
</BlurFade>
```

This satisfies the "NOT floating" requirement — the chat widget is inline within the page flow, not a floating button/drawer.

---

## 11. Implementation Phases

| Phase | Description                                                                                                                                                                                                | Estimated Effort |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| **1** | **KB loading & system prompt** — Create `lib/ai/knowledge-base.ts` and `lib/ai/system-prompt.ts`. Verify KB file reads correctly, prompt assembles with rules + language directive.                        | 1h               |
| **2** | **Provider adapter** — Create `lib/ai/provider.ts` with `AIProvider` interface, `GroqProvider` subclass, factory function. Requires installing `groq-sdk`. Verify streaming works locally.                 | 2h               |
| **3** | **API route** — Create `pages/api/chat.ts`. Wire up request validation, rate limiting (in-memory), system prompt construction, SSE streaming with `res.write()`.                                           | 3h               |
| **4** | **Chat widget molecules** — Create the four components. Start with `MessageBubble` (simplest), then `MessageInput`, then `MessageList`, then `ChatWidget/index.tsx` (orchestrator with fetch+SSE parsing). | 4h               |
| **5** | **Integration** — Embed `ChatWidget` in `index.tsx` below `ContactButtons`. Verify responsive layout, dark/light themes, animation smoothness.                                                             | 2h               |
| **6** | **Manual testing** — No test suite configured (per project rules). Test: streaming, rate limit, error banners, language toggle, clear on refresh, mobile layout, theme switching.                          | 2h               |

**Notes**:

- Phase 1 must complete before Phase 2 (provider needs system prompt).
- Phase 2 must complete before Phase 3 (API route imports provider).
- Phases 4 and 5 are sequential (components before integration).
- Phase 6 is manual-only — no Jest/Vitest configured.

---

## 12. Risks & Mitigations

| Risk                                                             | Likelihood | Impact                                           | Mitigation                                                                                                                                                               |
| ---------------------------------------------------------------- | ---------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Free tier provider changes limits or removes free tier**       | Medium     | High (chat stops working)                        | Adapter pattern allows 1-flag swap to Cerebras. Monitor provider status in dev.                                                                                          |
| **KB grows beyond token budget**                                 | Low        | Medium (truncated responses)                     | Trim oldest messages when conversation exceeds 60k tokens. Add KB size check in build script if it grows.                                                                |
| **SSE flush doesn't work on Vercel Edge runtime**                | Low        | High (no streaming)                              | Target Node.js runtime only (default in Next.js Pages Router). Test on `next dev` before deploy.                                                                         |
| **Rate limiter is per-process (doesn't scale across instances)** | Medium     | Low-Medium (rate limit bypass on multi-instance) | Acceptable for free tier. For production, swap to Redis-backed limiter — adapter already exists conceptually.                                                            |
| **Content filtered / hallucination**                             | Low        | Medium                                           | System prompt rules emphasize grounded-only. Add post-generation safety filter checking for "I don't have that info" pattern to avoid confidently wrong answers.         |
| **Spanish/English language detection fails**                     | Low        | Low                                              | Explicit language selector (ES/EN) in UI overrides auto-detection. User controls language, not just auto-detect.                                                         |
| **Conversation grows too large over time**                       | Medium     | Medium                                           | Cap at 50 messages; oldest trimmed. Client UI shows message count. No persistence means this resets on refresh.                                                          |
| **Component re-renders on every token (jank)**                   | Medium     | Medium                                           | Use `useTransition` for non-urgent state (new message content), `flushSync` for critical UI updates. Test FPS.                                                           |
| **Mobile keyboard covers chat input**                            | Medium     | Low                                              | `inputMode="text"`, `autoFocus` on input, viewport-aware padding via `env(safe-area-inset-bottom)`.                                                                      |
| **API key leaked to client**                                     | Low        | High (cost abuse)                                | Double-check: only `NEXT_PUBLIC_AI_PROVIDER` and `NEXT_PUBLIC_AI_CHAT_ENABLED` use the `NEXT_PUBLIC_` prefix. API key has no prefix. Lint rule or commit hook to verify. |

---

## Appendix: Key Decisions Summary

1. **Provider**: Groq (`llama-3.1-8b-instant`) — free tier with no expiry, best DX, adapter pattern for swapping.
2. **KB strategy**: Full KB loaded at module init (~9.5k tokens fits in 128k window) — no RAG complexity.
3. **Streaming**: SSE via `res.write()` + `res.flush()` on backend; `ReadableStream` parsing on frontend.
4. **No persistence**: Conversation resets on refresh per spec.
5. **Inline embedding**: ChatWidget placed in Hero below CTAs, not floating.
6. **Rate limiting**: In-memory, 30 req/day per IP — simple, free, sufficient.
7. **No tests**: Manual testing only (existing project has no test suite).

---

_Created during SDD Design phase — portfolio project._
