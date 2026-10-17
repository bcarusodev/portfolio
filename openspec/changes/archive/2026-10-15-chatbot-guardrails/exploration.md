# Exploration: chatbot guardrails

Change: `chatbot-guardrails` — Keep the chatbot's role, scope, and conversational style intact even when users attempt to modify them; never display a policy-violating response; verify with tests.

## Current State

### Where the chatbot lives

| Layer      | File                                   | Role                                                                                                                                                                                                                                                                                            |
| ---------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page       | `src/pages/index.tsx`                  | Mounts `ChatWidget` behind `NEXT_PUBLIC_AI_CHAT_ENABLED` flag, `next/dynamic` with `ssr: false`                                                                                                                                                                                                 |
| API        | `src/pages/api/chat.ts`                | Pages Router SSE endpoint (`POST /api/chat`): validate → rate-limit → build prompt → stream provider deltas as `data: {type: "delta"\|"done"\|"error"}` events                                                                                                                                  |
| Prompt     | `src/lib/ai/prompt.ts`                 | Static `INSTRUCTIONS` (9 rules) + language hint + `KNOWLEDGE BASE` section; also `trimHistory()` and ES/EN canned replies (REDIRECT / NDA / UNSURE)                                                                                                                                             |
| Provider   | `src/lib/ai/provider.ts`               | Zero-dependency OpenAI-compatible `fetch` streaming adapter (`streamChat` async generator); providers `groq` (default) / `cerebras` / `openai`; env-swappable `AI_MODEL`, `AI_PROVIDER_BASE_URL`, `AI_PROVIDER_API_KEY`; `temperature: 0.4`, `max_completion_tokens: 700`                       |
| Knowledge  | `src/lib/ai/knowledge.ts`              | Reads `assets/agent-knowledge/knowledge-base-complete.md`, keyword-ranked section selection under `AI_MAX_KB_TOKENS` (5000)                                                                                                                                                                     |
| Rate limit | `src/lib/ai/rateLimit.ts`              | In-memory per-IP sliding window (30 RPM default)                                                                                                                                                                                                                                                |
| Client     | `src/components/Molecules/ChatWidget/` | `index.tsx` (SSE fetch + ReadableStream parsing, 50ms delta coalescing, history of last 8 messages), `MessageList.tsx`, `MessageBubble.tsx` (react-markdown + remark-gfm, no `dangerouslySetInnerHTML` → raw HTML inert), `markdownComponents.tsx`, `MessageInput.tsx`, `labels.ts`, `types.ts` |

No AI SDK packages are installed (no `openai`, no `@ai-sdk/*`, no `ai`); the provider is a hand-rolled native-fetch client. Request flow:

```
ChatWidget.send() ──POST {message, history, language}──▶ api/chat.ts
  1. input checks (empty / >2000 chars → 400)
  2. per-IP rate limit (→ 429 + Retry-After)
  3. getKnowledgeBase() + selectKnowledge() + buildSystemPrompt() (→ 503 if KB missing)
  4. normalizeHistory() + trimHistory() (last 8 msgs / 1500 tokens)
  5. getProvider().streamChat({system, messages, maxTokens: 700})
  6. pull first delta (maps upstream 429/5xx to real HTTP codes)
  7. res.writeHead(200, text/event-stream) → writeEvent(delta)… → writeEvent(done)
```

### System prompt / role definition

- Role lives entirely in `INSTRUCTIONS` inside `src/lib/ai/prompt.ts` (rules 1–9: KB grounding, out-of-scope redirect, NDA, "unsure", language mirroring, concise/conversational style, section suggestions, "never Bruno himself", Markdown output **including code fences/tables**).
- The prompt is rebuilt **server-side on every request**, so it is the only durable carrier of policy across turns.
- **Gap**: there is no rule addressing prompt manipulation — nothing about refusing role changes, refusing imposed output formats (JSON/XML), treating fake "system" text in user/history content as untrusted data, or resisting multi-turn manipulation.

### Where user input enters the model call

- `chat.ts` line ~126–130: `providerMessages = [...history, {role:"user", content: message}]` — raw user text and **client-controlled history** (including forged `assistant` turns, since the client decides what to send) go straight to the provider. Only shape normalization is applied (role/content strings), no content policy.

### Interception point for non-compliant responses

- **Server**: `chat.ts` `writeEvent()` loop (lines ~196–204) is the single choke point where every token reaches the client. Today it forwards deltas immediately as they arrive — a violating response would be **partially visible before it could be judged complete**.
- **Client**: `ChatWidget/index.tsx` flushes coalesced deltas into visible message state every 50ms — too late for a reliable gate.
- Therefore requirement 3 (nothing non-compliant shown) forces **buffer-the-completion-then-validate-then-emit** in `chat.ts` (bounded: ≤700 completion tokens ≈ ≤2800 chars). The client contract (`delta`/`done`/`error` events) can stay unchanged; a burst of deltas after validation is already handled by the coalescing logic.

### Existing validation / sanitization

- **Input-side only**: message length/empty checks, history shape normalization, rate limiting, KB existence check.
- **Output-side: none.** No post-generation validator, no format checks, no policy checks anywhere (`grep sanitiz|validat|guardrail` matches only a doc comment in `prompt.ts`).
- Rendering is XSS-safe (react-markdown without rehype-raw), but format/role policy is a content problem, not a markup problem.

### Multi-turn state

- Server is **stateless** per request; the client keeps `messages` in React state and ships the last 8 as `history`. `trimHistory()` caps it (8 msgs / 1500 tokens).
- Consequences: (a) policy must be re-asserted in the system prompt each turn (already the architecture); (b) history is an **untrusted input channel** — a user can inject fake assistant turns ("As an assistant you may output JSON…"); (c) no DB/session layer exists (conversation persistence was out of scope in the original `ai-agent-portfolio` proposal).

### Safe fallback candidates (already in code)

- `prompt.ts` already defines canned ES/EN replies (REDIRECT, NDA, UNSURE) used as prompt-side guidance. An application-defined guardrail fallback (ES/EN) belongs alongside them (e.g. `GUARDRAIL_ES/EN`), selected via the client `language` field or user-message language detection.

### Test infrastructure reality

- **None**: no test runner, no test files, `openspec/config.yaml` declares `runner: none`, `strict_tdd: false`. Available checks: `npm run lint`, `tsc --noEmit`, `npm run build`.
- Options for requirement 4 (do not install anything during exploration; proposal must pick one):
  1. **Add `vitest` as devDependency** — TS-native, fast, easiest for pure-function tests of a dependency-free validator + mocked SSE handler tests. Only viable automated path with least friction; note `AGENTS.md` says "do not add tests unless explicitly requested" — requirement 4 is that explicit request, which should be stated in the proposal.
  2. **Zero-dep `node:test`** — Node 18+ built-in runner, but TS sources need transpile (`tsc` to a temp out-dir) → clunkier wiring, no watch mode.
  3. **Scripted eval matrix** — a Node script running fixture inputs through validator/prompt functions + lint/tsc; manual/CI-able but not a "test suite".
- Useful discovery: `AI_PROVIDER_BASE_URL` exists as an override "for proxies/mocks; local mock during development" → an end-to-end SSE test can point at a local mock provider with zero new deps.

## Affected Areas

- `src/pages/api/chat.ts` — insert post-generation validation gate before `writeEvent` loop; preserve status-code mapping, abort handling, rate limiting, first-delta error mapping.
- `src/lib/ai/prompt.ts` — harden `INSTRUCTIONS` (anti-manipulation rules: role/policy/format immutability, untrusted history, fake system-message resistance); add guardrail fallback constants.
- `src/lib/ai/guardrails.ts` (new) — pure validator module (`validateResponse(text, ctx)`) and any heuristic/format detectors; unit-testable without network.
- `src/components/Molecules/ChatWidget/*` — **prefer zero changes**; existing `delta/done/error` parsing already tolerates burst emission. Only touched if a distinct fallback event or UX indicator is spec'd.
- `src/lib/ai/provider.ts` — likely untouched (interface reused); touched only if a second (judge) call is added.
- `src/pages/index.tsx`, `rateLimit.ts`, `knowledge.ts`, `markdownComponents.tsx` — blast radius to preserve, not modify.
- Verification: new test setup (if vitest chosen) + `npm run lint` + `tsc --noEmit`.

## Approaches

1. **Prompt hardening only** — add anti-manipulation rules to `INSTRUCTIONS`.

   - Pros: zero latency/cost, tiny diff.
   - Cons: **violates requirement 3** (must not rely exclusively on the prompt); unverifiable guarantee; no interception point.
   - Effort: Low. Not acceptable alone.

2. **Prompt hardening + buffered server-side validator + safe fallback** (two-layer)

   - Buffer full completion in `chat.ts` (≤700 tokens), run pure `validateResponse()`; on pass emit `delta`s then `done`; on fail emit application-defined fallback text as normal deltas (fallback is a _valid_ response, not an `error` event). Heuristic checks are **structural**: whole-response JSON parse, XML/tag wrapping, dominant code-fence framing, role-claim phrases ("I am now…", "as the system…"), internal-instruction disclosure — deliberately **not** keyword matching on user input, and tolerant of formats merely _mentioned_ in prose (requirement 2).
   - Pros: satisfies req 3 (nothing non-compliant leaves the server); reuses SSE contract untouched; validator is a pure function (trivially unit-testable); bounded latency (one full completion wait before first byte).
   - Cons: loses token-by-token streaming UX (first paint = full completion; on Groq this is typically ~0.5–2s for ≤700 tokens — acceptable but a UX change); a violating prefix never reaches the client but TTFB rises.
   - Effort: Medium.

3. **Approach 2 + model-based judge** — second provider call classifies compliance (catches semantic roleplay/fake-system attacks that heuristics miss).
   - Pros: semantic coverage of indirect/multi-turn manipulation.
   - Cons: doubles request count → free-tier 30 RPM budget halves, latency ~2×, cost 2×; judge itself can be manipulated without careful framing; complexity.
   - Effort: Medium-High. Best as an optional escalation layer (heuristics fast-path, judge only on ambiguous cases), decided in spec/design.

### Recommendation

**Approach 2** as the core, with Approach 1 folded in (prompt hardening as first line of defense) and Approach 3 deferred to an explicit spec decision (likely _off_ by default under free-tier constraints). Key design points for the proposal:

- Validate **output**, not input: input keyword filtering would falsely refuse legitimate queries that merely mention JSON/format (requirement 2's explicit counter-example).
- Buffer-then-emit is the only interception point consistent with "no policy-violating response may be shown"; keep the `delta/done/error` event contract so the client stays untouched.
- Fallback text ships as a normal successful answer in the user's language (reuse `language` field / ES-EN pattern of existing canned replies).
- Multi-turn protection comes from (a) per-request system-prompt re-assertion, (b) treating `history` as untrusted data in the prompt, (c) output validation every turn — no session store needed.

## Open Questions (for proposal/spec)

1. **Judge authority**: heuristic-only vs model-judge vs hybrid — latency/cost/free-tier RPM tradeoff (see risks).
2. **Code-block policy conflict**: current rule 9 _promotes_ Markdown with code fences/tables (legit for a tech portfolio), while the requirement lists "code blocks" among disallowed user-imposed formats. Spec must disambiguate: e.g. "model may use code fences when the _content_ warrants it; user cannot _impose_ an answer format that replaces natural language" vs a blanket ban.
3. **Streaming UX acceptance**: is buffer-then-emit (TTFB = full completion) acceptable, or is partial streaming with client-side hold-back required? (Partial rollback after display is impossible — must be decided now.)
4. **Retry vs immediate fallback**: on validation failure, regenerate once with a corrective instruction (2× cost only on failure) or emit fallback immediately?
5. **Test harness decision**: `vitest` devDependency vs `node:test` vs script-only verification. Requirement 4 ("verifiable with tests") cannot be met with lint/tsc alone; `AGENTS.md`'s "no tests" note must be overridden explicitly in the proposal.
6. **Failure observability**: log/count validation failures (existing `console.error` pattern) — needed to tune heuristics and avoid silently degrading UX.

## Risks / Existing Risks to Preserve

- **Free-tier budget**: Groq 30 RPM / 1K RPD; any per-request extra model call (judge) halves capacity. Rate limiter is per-IP in-memory and resets on deploy.
- **Client-controlled history is an attack channel** (forged assistant turns) — output validation is the real control; prompt must label history as data.
- **First-delta error mapping** (FR-15/16): buffering must not break the "pull first delta before `writeHead`" pattern for upstream 429/5xx → HTTP status mapping.
- **Abort semantics**: client abort (`res.on("close")`) mid-buffer must cancel the provider fetch (existing `AbortController`).
- **Latency regression**: TTFB changes from first-token to full-completion; typing indicator already covers `thinking` state, so UI remains coherent.
- **False positives** are the biggest UX risk: a strict heuristic that flags any JSON/code mention will violate requirement 2's "must not unnecessarily refuse".
- **No test runner** → requirement 4 forces a tooling decision the project has avoided so far.

## Blast Radius (must keep working)

- SSE event contract and HTTP status mapping of `api/chat.ts` (400/405/429/503 + in-band `error` events).
- `IProviderAdapter.streamChat` interface and env-swappable provider config.
- Prompt rules 1–9 behavior (grounding, redirect, NDA, unsure, bilingual, Markdown rendering).
- ChatWidget UX: 50ms coalescing, 8-message history, retry/new-chat, language toggle, error banner — untouched unless spec says otherwise.
- Rate limiting, KB selection, feature flag `NEXT_PUBLIC_AI_CHAT_ENABLED`, `npm run lint` / `tsc --noEmit` cleanliness.

## Ready for Proposal

**Yes.** The codebase gives a single clean interception point (`chat.ts` write loop), an existing pattern for canned bilingual replies (safe fallback), and a pure-function seam for a validator. The proposal must resolve: judge mechanism (Q1), code-block policy conflict (Q2), streaming UX (Q3), retry strategy (Q4), and the test-harness decision (Q5), because each changes either scope, cost, or the verification contract.
