# Proposal: AI Agent for Portfolio

## Intent

Portfolio visitors cannot interact with Bruno's content beyond static reading. An AI chat agent grounded in verified professional data lets visitors ask specific questions about skills, experience, projects, and technologies — increasing engagement and memorability.

## Scope

### In Scope

- Embedded chat interface on the Home page (centered, below "Explore My Story" and "Projects" buttons) — NOT a floating widget
- Pages Router API route (`src/pages/api/chat.ts`) with SSE streaming
- Knowledge base (`data/agent-knowledge.ts`) with structured Bruno data
- Bilingual support (Spanish/English) via system prompt
- Anti-hallucination guardrails: strict grounding to knowledge base
- Free-tier provider integration (no per-visitor cost)

### Out of Scope

- Availability indicator / booking CTA
- Conversation history / persistence
- Authentication or rate limiting (v1)
- Voice input/output
- Multi-modal capabilities
- Mobile-optimized drawer variant (widget only for v1)

## Capabilities

### New Capabilities

- `ai-chat-widget`: Embedded chat UI on the Home page (centered, below CTA buttons) with streaming display, input, language toggle
- `chat-api`: Pages Router API route handling streaming LLM responses via SSE
- `knowledge-base`: Structured data source containing Bruno's professional information
- `guardrails`: System prompt engineering and input/output filtering for anti-hallucination

### Modified Capabilities

None

## Approach

**Frontend**: Molecule component at `src/components/Molecules/ChatWidget/`. Embedded directly in the Home page, centered below the hero section CTA buttons ("Explore My Story" and "Projects"). Not a floating/popup widget — it's a first-class section of the landing page. Uses `EventSource` or `fetch` with `ReadableStream` for streaming. Framer Motion for message entry animations. Dark mode support via existing theme system.

**Backend**: `src/pages/api/chat.ts` — standard Pages Router API route. Receives user message, constructs system prompt from knowledge base, calls LLM provider, streams response via `res.write()` chunks. No external dependencies beyond LLM SDK.

**Data**: `assets/agent-knowledge/knowledge-base-complete.md` exports structured objects (bio, skills, experience, technologies, projects). API route injects this as system context. No external DB or CMS.

**Provider**: Evaluate Groq (free tier, fast inference), Cerebras (free tier), or OpenAI free credits. Selection criteria: streaming support, free tier limits, reliability, cost sustainability.

**Guardrails**: System prompt starts with "Answer ONLY about Bruno Caruso's professional profile. If the question is outside this scope, politely decline." Knowledge base is the sole source of truth — no web access, no creative generation.

## Affected Areas

| Area                                                | Impact   | Description                      |
| --------------------------------------------------- | -------- | -------------------------------- |
| `src/components/Molecules/ChatWidget/`              | New      | Chat widget molecule component   |
| `src/pages/index.tsx`                               | Modified | Embed ChatWidget below hero CTAs |
| `src/pages/api/chat.ts`                             | New      | Streaming API route              |
| `assets/agent-knowledge/knowledge-base-complete.md` | New      | Knowledge base data              |

## Risks

| Risk                              | Likelihood | Mitigation                                                             |
| --------------------------------- | ---------- | ---------------------------------------------------------------------- |
| Free tier rate limits exhausted   | Medium     | Implement client-side debounce, show friendly limit message            |
| LLM provider deprecates free tier | Low        | Provider-agnostic adapter pattern; easy swap                           |
| Hallucinated responses            | High       | Strict system prompt, knowledge-base-only grounding, output validation |
| Streaming SSE compatibility       | Low        | Pages Router `res.write()` is well-supported on Vercel                 |

## Rollback Plan

Remove `ChatWidget` import and component from `index.tsx`, delete `api/chat.ts`, remove `data/agent-knowledge.ts`. No database migrations, no persistent state. Feature flag via env var `NEXT_PUBLIC_AI_CHAT_ENABLED` for gradual rollout.

## Dependencies

- LLM provider SDK (selected during implementation)
- Vercel deployment (already in use)

## Success Criteria

- [ ] Chat interface renders centered on Home page below hero CTAs
- [ ] Streaming responses display character-by-character without lag
- [ ] Agent correctly answers questions about Bruno's skills, experience, and technologies
- [ ] Agent declines questions outside Bruno's professional scope
- [ ] Bilingual responses in Spanish and English
- [ ] Zero hallucinated facts when tested against knowledge base
- [ ] No per-visitor cost (free tier sustained)
