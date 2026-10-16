# Proposal: Chatbot Guardrails

## Intent

The chatbot's role and policies live only in an unhardened prompt, and `chat.ts` streams unvalidated output — manipulated replies become visible before judgment. Enforcement must become structural and test-verified.

## Background / Current State

- `prompt.ts` rules 1–9 rebuilt per request; none address manipulation; rule 9 allows code fences/tables.
- `chat.ts` forwards client-controlled history (forgeable assistant turns) to the provider; `writeEvent()` is the choke point.
- Output validation: none. Test runner: none (gates: lint, `tsc --noEmit`).

## Scope

**In**

- Hardened `INSTRUCTIONS`: role/policy/format immutability, history-as-untrusted-data, fake-system/roleplay/multi-turn resistance.
- New pure `src/lib/ai/guardrails.ts` → `validateResponse(text, ctx)` structural heuristics.
- Buffer-then-validate-then-emit gate in `chat.ts`; bilingual `GUARDRAIL_ES/EN` fallback as normal deltas; failure logging.
- **`vitest` devDependency — tests explicitly authorized by requirement 4, overriding the project's "no tests" default**; validator + SSE handler tests.

**Out**

- Model judge (deferred, off by default — free-tier RPM); retry-before-fallback (deferred).
- ChatWidget changes, input keyword filtering, persistence.

## Capabilities

- **New**: `chatbot-guardrails` — prompt rules, imposed-format policy, output gate, fallback, tests.
- **Modified**: None — `openspec/specs/` is empty; SSE-gate behavior lives in the new capability.

## Approach

- **Prompt-only** — violates the "no prompt-only" requirement; kept only as layer 1.
- **Prompt + buffered validator + fallback (adopted)** — TTFB = full completion (~0.5–2s); nothing violating leaves the server; pure-function testable; SSE contract unchanged.
- **+ model judge (deferred)** — semantic coverage, but halves free-tier RPM, ~2× latency, judge manipulable.

**Imposed vs organic**: model may organically use fences/tables when warranted (rule 9 preserved). Blocked: dominant imposed structure replacing natural language — whole-response JSON/XML, tag wrapping, code-fence framing, role claims, instruction disclosure. Prose mentions stay compliant (requirement 2).

**Multi-turn**: prompt re-asserted per request, history as data, output validated per turn; input never filtered.

## Affected Areas

- `src/lib/ai/guardrails.ts` — New; plus `vitest.config.ts` and `*.test.ts`.
- `src/pages/api/chat.ts` — Modified (gate; keeps first-delta error mapping + AbortController).
- `src/lib/ai/prompt.ts` — Modified (rules + fallback constants).
- `ChatWidget/*`, `provider.ts` — Unchanged.

## Risks

- False positives refuse legit answers (Med) → structural checks + format-mention fixtures.
- Buffering breaks 429/5xx mapping or abort (Low) → preserve pull-first-delta order; handler tests.
- TTFB regression (Med) → accepted; bounded buffer; typing indicator.

## Open Questions

Resolved: heuristic-only; imposed-vs-organic defined; buffer-then-emit; immediate fallback; vitest authorized; failure logging. Deferred: model judge, retry-once.

## Rollback Plan

Revert commits: remove `guardrails.ts`, tests, vitest config; restore `prompt.ts`/`chat.ts`; drop `vitest`. No data impact; streaming resumes immediately.

## Dependencies

`vitest` (dev-only). No runtime dependencies.

## Success Criteria (acceptance outline for spec)

- Legitimate and KB queries pass untouched.
- Incompatible format request → natural-language answer: no adoption, no unnecessary refusal, no internal-instruction discussion.
- Direct, indirect, roleplay, fake-system, multi-turn manipulations never reach the client; bilingual fallback instead.
- SSE contract, status codes, abort/error behavior, rate limiting preserved; lint, `tsc --noEmit`, `npm test` green.
