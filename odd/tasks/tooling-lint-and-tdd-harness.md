# Feature: Tooling repair + TDD harness

Objective: make `lint` and `test` actually work so future changes can follow TDD, and add coverage to the untested AI chat logic.
Branch: TBD (current branch `fix/chatbot-rate-limit` is unrelated; commit strategy pending user decision)
Delivery strategy: ask-on-risk
Test runner: Vitest (`npm test`, `vitest run`, node environment, `src/**/*.test.{ts,tsx}`)

## Specs

- **S1** — After `npm install`, `vitest` is present and `npm test` passes. Today it fails with
  exactly `sh: vitest: command not found` because `vitest` is declared in `package.json` and
  present in `package-lock.json` but absent from `node_modules`.
- **S2** — `npm run lint` lints `.ts`/`.tsx`/`.js`/`.jsx` files (not a silent no-op) and exits
  non-zero on a violation.
- **S3** — ESLint must not fail with exactly `ESLint couldn't find the config "standard" to
extend from`. `.eslintrc.json` extends `standard` and must resolve it.
- **S4** — A real invocation (`npx eslint .`) exits `0` on the current tree. Pre-existing
  violations on the tree: 2 × `no-void` in `src/components/Molecules/ChatWidget/index.tsx`,
  2 × `import/no-duplicates` in `src/pages/api/chat.ts`.
- **S5** — `vitest.config.ts` resolves the `@` and `@data` aliases and includes `*.test.tsx`.
- **S6** — Generated Velite output `.velite/` is ignored by Prettier and ESLint. `.eslintrc.json`
  currently ignores the dead `.contentlayer/` and not `.velite/`; `.prettierignore` ignores neither.
- **S7** — Tests exist for the currently untested modules: `src/lib/ai/prompt.ts`,
  `src/lib/ai/provider.ts`, `src/lib/ai/knowledge.ts`, `src/lib/utils.ts`.
- **S8** — Behavior-preserving: no runtime behavior of `/api/chat` or the ChatWidget changes.

Assumption (marked): the project's testing convention is node-environment
`renderToStaticMarkup` (see `markdownComponents.test.ts`), not jsdom + Testing Library. New tests
follow that convention; no new runtime test dependency is added.

Note on TDD: S7 adds characterization tests for existing behavior, so there is no legitimate
RED→GREEN cycle for them. No RED evidence is claimed. TDD applies to the project going forward,
enabled by S1–S6.

## Tasks

All tasks complete; no commits (see L5).

- T1 — DONE — Merge duplicate `@/lib/ai/prompt` imports in `src/pages/api/chat.ts` (S4, S8)
- T2 — DONE — Remove `no-void` usage in `src/components/Molecules/ChatWidget/index.tsx` (S4, S8)
- T3 — DONE — Add `eslint-config-standard` + `eslint-plugin-import|n|promise` dev deps (S3)
- T4 — DONE — Add `lint`/`lint:fix`/`test:watch`/`typecheck` scripts to `package.json` (S2, S1)
- T5 — DONE — Ignore `.velite/` in `.eslintrc.json` (S6)
- T6 — DONE — Ignore `.velite` in `.prettierignore` (S6)
- T7 — DONE — Add `@data`/`@velite` aliases and `.tsx` include to `vitest.config.ts` (S5)
- T8 — DONE — Add tests for prompt/provider/knowledge/utils + TSX alias guard (S7)
- T9 — DONE — Update `AGENTS.md` to the fixed state
- T10 — DONE — Redirect `tsBuildInfoFile` to `node_modules/.cache/` so `typecheck` is clean (S-tooling)

Risk: item 5 (dependency changes — new ESLint dev dependencies and lockfile churn).

## Log

- **L1 (user, verbatim)**: "yes fix all and consider adding tests due we will use TDD"
  (following the agent's offer: "Want me to fix the lint breakage (add `eslint-config-standard`
  and give `npm run lint` a real path), or keep `AGENTS.md` documentation-only?")
- **L2 (evidence)**: `npx eslint .` → exit 2, `ESLint couldn't find the config "standard" to
extend from`. Bare `eslint` (what `npm run lint` runs) → exit 0, zero files linted. So
  `.husky/pre-commit` was passing vacuously.
- **L3 (evidence)**: after `npm install --save-dev eslint-config-standard@^17 eslint-plugin-import@^2
eslint-plugin-n@^16 eslint-plugin-promise@^6`, `eslint --ext .ts,.tsx,.js,.jsx .` lints 78 files
  with exactly 4 pre-existing errors (2 `no-void`, 2 `import/no-duplicates`) — tractable, so
  `standard` is kept rather than dropped.
- **L4 (evidence)**: baseline `npm test` after `npm install` → 5 files / 75 tests passing.
- **L5 (final)**: all tasks done, no commits. HEAD (`fix/chatbot-rate-limit`, cf9d6ff) is 3 commits
  ahead of `develop` (a83b7da) with unrelated config commits, so work-unit commits would mix
  concerns. Commit/branch choice deferred to the user.
- **L6 (evidence, independent verifier `gentle-ai-verify`)**: verdict = all 8 specs MET,
  0 blockers, 4 advisories. Independently reproduced the RED states (`git show HEAD:<file>` piped
  through `eslint --stdin` → 2 × `import/no-duplicates` in `chat.ts`, 2 × `no-void` in
  `ChatWidget`), confirmed the old bare-`eslint` script was a true no-op (exit 0, `-f json` →
  `[]`), falsified the alias guard (missing `@data` → `Cannot find package '@data/Hero'`),
  falsified both S6 ignores, and ran 4 mutation probes (twMerge→clsx, Math.ceil→Math.floor, slice
  sign flip, 503→500) all of which went RED then re-GREEN.
- **L7 (change)**: `tsconfig.json` gained
  `"tsBuildInfoFile": "node_modules/.cache/tsconfig.tsbuildinfo"` so the new `typecheck` script
  stops dirtying the tracked root `tsconfig.tsbuildinfo`. Verified: typecheck exits 0 and
  regenerates the cache file while the tracked file stays unchanged.
- **L8 (change)**: `src/lib/aliases.test.ts` → `src/lib/aliases.test.tsx` with a
  `renderToStaticMarkup` assertion, so the S5 TSX include has committed proof rather than only the
  verifier's scratch probe. Final: 10 files / 108 tests, lint 0 errors, typecheck 0.
- **L9 (declined)**: the verifier suggested a `toolingIgnores.test.ts` asserting `package.json`
  script text and ignore-file contents. Declined as low-signal config-text assertions; the
  behavioral falsifications were performed against real tool runs. Available as a ~15-line add if
  wanted.
