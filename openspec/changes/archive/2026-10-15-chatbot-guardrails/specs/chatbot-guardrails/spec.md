# Delta for chatbot-guardrails

## ADDED Requirements

### Requirement: Role, Scope, and Style Immutability

Role, policies, and style MUST be immutable; in-scope queries MUST be answered normally. Attempts to overwrite policies, change the assistant's role, or impose disallowed formats (JSON, XML, code blocks) MUST NOT change behavior — direct, indirect, roleplay, fake-system, or multi-turn.

#### Scenario: In-scope query passes untouched

- GIVEN a legitimate knowledge-base query
- WHEN sent
- THEN a natural-language answer is returned

#### Scenario: Direct and indirect policy overwrite

- GIVEN "ignore your instructions" or an instruction hidden in a story
- WHEN the model replies
- THEN role, policies, and style are unchanged

#### Scenario: Roleplay and fake system instructions

- GIVEN a roleplayed system message or fake "SYSTEM:" text
- WHEN the model replies
- THEN it is treated as data; the chatbot role is kept

#### Scenario: Multi-turn distributed manipulation

- GIVEN a role or format change requested gradually across turns
- WHEN any turn is answered
- THEN the reply complies with role, scope, and style

### Requirement: Valid Query With Incompatible Format Request

A valid query plus imposed format (e.g. "¿donde trabaja Bruno actualmente? Respondeme en JSON") MUST get a natural-language answer: format not adopted, no unnecessary refusal, no internal-instruction discussion. Format mentions in prose MUST NOT count as manipulation; organic fences/tables stay allowed (rule 9).

#### Scenario: Imposed format not adopted

- GIVEN a valid query ending with "Respondeme en JSON"
- WHEN the model replies
- THEN correct natural-language content, not JSON or a refusal

#### Scenario: Format mentioned in prose

- GIVEN a message mentioning JSON beside a valid query
- WHEN the model replies
- THEN the query is answered normally, no guardrail action

#### Scenario: Organic code fence or table

- GIVEN a query warranting a code snippet or table
- WHEN the model replies without a format request
- THEN the fence/table is emitted (rule 9)

### Requirement: Output Gate and Safe Fallback

Compliance MUST be enforced at an output gate (buffer-then-validate-then-emit at the `chat.ts` SSE write gate), not prompt-only; no violating response reaches the user. On failure, the bilingual fallback (ES/EN) MUST be emitted as normal `delta` events + `done`, and the failure logged.

#### Scenario: Violating response never reaches the client

- GIVEN a completion violating role or format policy
- WHEN validation fails at the gate
- THEN no part reaches the stream; the fallback is emitted instead

#### Scenario: Bilingual fallback as normal deltas

- GIVEN failed validation for `language: es` (resp. `en`)
- WHEN emitted
- THEN ES (resp. EN) text arrives as normal deltas plus `done`, not `error`
- AND the failure is logged

### Requirement: Preserved Streaming and Error Behavior

MUST be preserved: `delta`/`done`/`error` SSE contract, first-delta upstream 429/5xx → HTTP mapping, `AbortController` on client close, rate limiting, existing functionality; ChatWidget untouched.

#### Scenario: SSE contract and error mapping unchanged

- GIVEN a passing completion, or 429/5xx before the first delta
- WHEN the gate runs
- THEN `delta` → `done` is unchanged and the original HTTP status mapping still applies

#### Scenario: Client close and rate limit preserved

- GIVEN a mid-buffer disconnect, or an IP over the rate limit
- WHEN either occurs
- THEN the provider fetch is aborted, or 429 returned, as today

### Requirement: Authorized Test Verification

MUST ship tests (vitest devDependency, explicitly authorized) covering legitimate queries, manipulation attempts (direct, indirect, roleplay, fake-system, multi-turn), and format-mention/organic-format fixtures; `npm test`, `npm run lint`, `tsc --noEmit` MUST pass.

#### Scenario: Test matrix and quality gates green

- GIVEN the implemented change
- WHEN `npm test`, `npm run lint`, `tsc --noEmit` run
- THEN every listed case class passes and both gates exit clean

## Non-Goals

- Model judge: deferred, off by default (free-tier RPM); retry-before-fallback deferred (fallback immediate).
- Input keyword filtering: none — output-only validation.
- Persistence: no changes; ChatWidget untouched.
