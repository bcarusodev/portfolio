# Archive Report — avoid-malicious-rate-limiting-anonymous-chatbot

- **Change**: avoid-malicious-rate-limiting-anonymous-chatbot
- **Archived to**: `openspec/changes/archive/2026-10-16-avoid-malicious-rate-limiting-anonymous-chatbot/`
- **Archive folder date**: 2026-10-16
- **Artifact store**: hybrid (OpenSpec filesystem + Engram topic `sdd/avoid-malicious-rate-limiting-anonymous-chatbot/archive-report`)
- **Status**: SDD cycle closed — specs synced, change folder archived, delivery user-owned
- **Branch**: `feature/chatbot-guardrails` (base for all commits)

## Work Units

All 4 work units committed on `feature/chatbot-guardrails`:

| #   | Commit    | Work unit                                                                |
| --- | --------- | ------------------------------------------------------------------------ |
| 1   | `8af0e02` | `feat(ai)`: VERCEL-gated client IP resolver (`clientIp.ts` + tests)      |
| 2   | `af3defa` | `feat(ai)`: per-IP daily cap + global arrival cap in the rate limiter    |
| 3   | `bfa84b9` | `feat(api)`: route wiring + structured 429 logs in `/api/chat`           |
| 4   | `30f4133` | `chore`: env knobs in `.env.example` + vitest enabled in OpenSpec config |

## Verification — Final Verdict

**PASS WITH WARNINGS** — verified AFTER apply, at HEAD `30f4133e695558d252876411afef33f69bad61c5`:

- Spec compliance: 6/6 requirements (R1–R6), 11/11 scenarios — all PASS.
- Gates: `npm test` 75/75 (exit 0), `npm run lint` exit 0, `npx tsc --noEmit` exit 0.
- Zero CRITICAL findings, zero blockers.
- Committed diff scope: 8 files, 597+/17−; no ChatWidget file, no `package.json`/`package-lock.json` touched — zero new dependencies, ChatWidget contract untouched.
- Source: Engram `verify-report` #61 (`sdd/avoid-malicious-rate-limiting-anonymous-chatbot/verify-report`, persisted 2026-10-16 21:19) and archived `verify-report.md`; the orchestrator's final-state facts agree with both.

## Warning Left Open (deliberate, user-approved)

1. `openspec/config.yaml` `context:` block (line 7) still states "No test suite configured", contradicting the `testing:` block (`runner: vitest`, `command: "npm test"`) in the same file. The user chose archive-now; this is to be fixed opportunistically later as a trivial chore. Machine-adjacent config text only — it affects no gate run. (Reported by `verify-report` #61 as the single WARNING; still open at close.)

## Follow-ups (non-blocking SUGGESTIONs, per verify-report #61 — all unfixed at close)

1. Design's changed-line forecast (~370) undercounted test volume (actual ~614 changed lines, 597+/17−); within the authorized 800-line budget, but future forecasts should count test lines explicitly.
2. `chat.test.ts > … logs reason global…` asserts `reason: "global"` but not the exactly-once call count (minute and daily tests do); the shared log branch makes a second log structurally impossible.
3. Design open questions remain human decisions: confirm the 60 RPD/IP default and the `VERCEL` marker assumption; decide whether unsalted `ipHash` is acceptable or an optional `AI_LOG_IP_SALT` should be added.
4. Fold the `readNonNegativeInt` empty-string refinement (empty env → default, not `Number("")===0` disabling the cap) into `design.md` so docs match the code.

## Native Runtime Ledger

- **Apply objective**: settled **complete** — required one maintainer-approved reset after a 1132-line candidate exceeded the 800-line cap; that candidate included ~518 lines of pre-existing baseline noise (scope difference: candidate tree vs. the 614-line committed diff measured by verify). All 10 tasks then completed as 4 work-unit commits.
- **Verify objective**: settled **complete** cleanly (PASS WITH WARNINGS, no blockers).
- **Review**: RDD disabled → ordinary repository policy; `reviewGate` structurally absent, no receipt exists or is required (Native Review Receipt Gate satisfied by absence).

## Spec Sync (Source of Truth)

- Created `openspec/specs/chatbot-rate-limiting/spec.md` — no prior main spec existed for this domain, so the delta was treated as a full spec and copied mechanically (precedent: archived `chatbot-guardrails`).
- Contents: 6 requirements, 11 scenarios, Non-Goals section preserved.
- Readback evidence: `diff -r <delta spec> <main spec>` → **empty output, exit 0** (both temp-stage and final comparisons); SHA-256 both sides `5C0FC195F54FF8045BC9C9838DA79E16FC3A071A6ADA2201D5D732EDDE8BFE9D`.
- No requirements removed or modified from any existing main spec (`chatbot-guardrails` untouched — its "429 returned as today" requirement remains satisfied).

## Archive Move

- `openspec/changes/avoid-malicious-rate-limiting-anonymous-chatbot/` → `openspec/changes/archive/2026-10-16-avoid-malicious-rate-limiting-anonymous-chatbot/` via `mv` (directory is untracked, so `git mv` is not applicable; whole move run as one shell transaction with a pre-move recursive snapshot).
- Readback: pre-move snapshot vs. archived tree `diff -r` → **empty output, exit 0**; source directory confirmed absent.
- Archive inventory: `proposal.md`, `exploration.md`, `design.md`, `tasks.md`, `apply-progress.md`, `verify-report.md`, `specs/chatbot-rate-limiting/spec.md`, `archive-report.md` (additive — written after the move, excluded from the snapshot comparison).

## Gates at Close

- [x] Task Completion Gate: archived `tasks.md` has 10/10 checked, 0 unchecked implementation tasks (no reconciliation needed).
- [x] Native Review Receipt Gate: `reviewGate` structurally absent (RDD disabled) → archive proceeds under ordinary repository policy.
- [x] Verify verdict PASS WITH WARNINGS with 0 CRITICAL → archive allowed (no override used).
- [x] Main spec synced; verbatim `diff -r` readback empty (exit 0).
- [x] Change folder moved; active `openspec/changes/` now contains only `archive/`.
- [x] Archive contains all artifacts (proposal, specs, design, tasks, exploration, apply/verify progress, verify report).
- [x] Baseline integrity: the 6 pre-existing dirty files (`ChatWidget/MessageInput.tsx`, `ChatWidget/index.tsx`, `ContactButtons/index.tsx`, `constants.ts`, `pages/index.tsx`, `tsconfig.tsbuildinfo`) remain uncommitted and untouched; no new commits were created by this phase; archive artifacts and main spec remain untracked (delivery under ordinary repo policy, RDD disabled).

## Evidence Traceability (Engram observations read)

| ID  | Topic                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------- |
| #51 | `sdd/i-want-to-avoid-malicious-rate-limitting-when-anonymous-users-interacts-with-my-chatbot/proposal` (older planning topic) |
| #52 | `…/spec` — delta spec, byte-identical to the OpenSpec copy per verify-report #61                                              |
| #54 | `…/design`                                                                                                                    |
| #56 | `…/tasks`                                                                                                                     |
| #58 | `sdd/avoid-malicious-rate-limiting-anonymous-chatbot/apply-progress`                                                          |
| #61 | `sdd/avoid-malicious-rate-limiting-anonymous-chatbot/verify-report`                                                           |

## Snapshot vs. Final-State Notes

`apply-progress` (#58) and `verify-report` (#61) are intermediate snapshots; the facts above are final state per the orchestrator's launch-prompt final-state facts (2026-10-16), which rank above them. No unrankable contradictions were found: the only snapshot claim still open at close is the config `context:` WARNING, which was deliberately deferred by the user, and the 1132-line reset figure (candidate tree including baseline noise) vs. verify's 614 committed changed lines are different measurement scopes, not a conflict.

## Delivery State

**Not merged, not pushed.** All 4 commits remain on `feature/chatbot-guardrails`; merge, push, and PR creation are user-owned actions. The 6 baseline dirty files stay uncommitted by design; archive artifacts and the new main spec are untracked (nothing committed by this phase).
