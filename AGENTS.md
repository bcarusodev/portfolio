# AGENTS.md — Portfolio (Next.js + Velite + Tailwind)

Personal portfolio site. Atomic Design components over the Next.js **Pages Router**.

## Stack (verified against code — trust this over README.md)

- **Next.js 16** (Pages Router), **React 18**, TypeScript, Node 18+.
- **Styling**: Tailwind CSS + Radix UI + CVA (shadcn/ui, "new-york"). See `components.json`.
- **Content**: **Velite** (migrated _from_ ContentLayer; `@velite` is the generated module).
- **Tests**: Vitest, node environment, no jsdom.
- `README.md` is stale: it claims **Chakra UI** and **ContentLayer**. Chakra is gone (not in
  `package.json`, zero imports); content is Velite. Do not reintroduce either.

## Commands

| Command              | Runs                               | Notes                                                       |
| -------------------- | ---------------------------------- | ----------------------------------------------------------- |
| `npm install`        | deps                               | Run first on a fresh checkout.                              |
| `npm run dev`        | `velite && next dev`               | `velite` (no subcommand) builds content **once and exits**. |
| `npm run build`      | `velite build && next build`       |                                                             |
| `npm test`           | `vitest run`                       | Single file: `npx vitest run src/lib/ai/guardrails.test.ts` |
| `npm run test:watch` | `vitest`                           | Watch mode — the TDD loop.                                  |
| `npm run lint`       | `eslint --ext .ts,.tsx,.js,.jsx .` | Fails on error-level rules only; warnings do not fail.      |
| `npm run lint:fix`   | same, with `--fix`                 |                                                             |
| `npm run typecheck`  | `tsc --noEmit`                     | Writes cache to `node_modules/.cache/`, not the repo.       |

## Tooling traps

- **`npm run lint` fails on errors, not warnings.** `no-var` and similar are configured as
  warnings and pass; `no-undef` and `import/no-duplicates` are errors and fail the run. A green
  lint run does not mean zero findings.
- **`.velite/` is generated and gitignored.** `@velite` imports (e.g. `src/pages/work.tsx`,
  `data/work/loader.ts`) resolve to `.velite/index`. On a fresh checkout, run `npx velite`
  before `tsc` / `next build`, or the import is unresolvable.
- **Editing project markdown does not hot-reload.** `npm run dev` runs `velite` once, then
  `next dev`. After editing `data/work/*.md`, rerun `npx velite`, or run `npx velite dev` in a
  second terminal for watch mode.
- **Tests are node-environment only.** `vitest.config.ts` includes `src/**/*.test.{ts,tsx}` with
  `environment: "node"`. Component tests go through `renderToStaticMarkup` (see
  `markdownComponents.test.ts`); there is no jsdom or Testing Library — do not add them without a
  deliberate decision. Aliases `@`, `@data`, `@velite` mirror `tsconfig.json`, and Vite matches
  aliases by prefix **in declaration order**, so `@data` / `@velite` must stay before the bare
  `@`. `src/lib/aliases.test.tsx` guards that ordering.
- **The stale root `tsconfig.tsbuildinfo` is a leftover.** `typecheck` now writes build info to
  `node_modules/.cache/`, so that tracked file is never regenerated. It should be
  `git rm --cached` and gitignored — do not treat it as build output you need to commit.

## Path aliases (`tsconfig.json`)

- `@/*` → `src/*`
- `@data/*` → `data/*`
- `@velite`, `@velite/*` → `.velite/index`, `.velite/*`

## Layout

- `src/components/{Atoms,Molecules,Organisms}/` — Atomic Design. `src/components/ui/` holds
  shadcn/ui primitives; add via the shadcn CLI using `components.json` (`@/lib/utils` exports `cn()`).
- `src/pages/` — **Pages Router only** (`_app`, `_document`, `index`, `about`, `work`,
  `work/[id]`, `api/chat`). There is no App Router. **Never add `"use client"`** — that is an
  App Router directive and is meaningless here.
- `data/*.ts` — static content (Hero, Skills, Experience, NavItems, Technologies).
- `data/work/*.md` — project markdown, schema in `velite.config.ts`; `data/work/loader.ts` owns
  `getStaticProps`/`getStaticPaths` and `stacksMap` (stack key → icon/color).
- `src/constants.ts` — shared IDs/constants.

## AI chat agent (`/api/chat`)

- `src/pages/api/chat.ts` — POST SSE streaming endpoint; failures are JSON status codes
  (400/429/503) before the stream opens, in-band `error` events after.
- `src/lib/ai/` — `provider.ts` (`groq|cerebras|openai`), `guardrails.ts`, `rateLimit.ts`,
  `answerCache.ts`, `knowledge.ts`, `prompt.ts`, `clientIp.ts`.
- **Rate limiting is in-memory per process** — resets on restart and is not shared across
  instances. Do not treat it as a distributed limit. The **answer cache**
  (`src/lib/ai/answerCache.ts`) has the same scope: repeated history-less questions are
  served from memory for zero upstream tokens.
- **The provider's free tier is the binding constraint** (Groq gpt-oss: 8K TPM / 200K TPD
  per organisation, cached tokens excluded). Anything that grows the per-request budget —
  `AI_MAX_KB_TOKENS`, `AI_MAX_COMPLETION_TOKENS`, history, a bigger pinned core — trades
  directly against how many answers a day the site can serve. `src/lib/ai/knowledge.ts`
  keeps the heading index + identity core byte-identical across queries so the provider can
  cache that prefix; keep that stable-prefix ordering intact.
- **The completion cap must sit above the natural answer length.** Measured completions on
  the free tier ran 313, 435 and 536 tokens; at `AI_MAX_COMPLETION_TOKENS=480` a measured
  answer ended with `finish_reason: "length"` at exactly 480 completion tokens and shipped
  truncated as if it were complete. `chat.ts` now continues a truncated answer once
  (`AI_CONTINUATIONS_MAX`) and reports a truncation that survives the budget as
  `code: "truncated"` instead of a `done`; keep reading `finish_reason` before changing any
  of this. A continuation re-sends the whole prompt, so it costs far more than a
  comfortably larger cap — never buy rate-limit headroom by cutting the cap into the
  answer distribution.
- **How Groq accounts the cap toward the token rate limit is NOT established.** Do not
  repeat the earlier "debits `prompt + max_completion_tokens` as declared" claim: that
  reading came from a request that was truncated _at_ its cap, so declared and actual were
  the same number. A later probe with a tiny prompt and `cap 700` reported 619 window
  tokens consumed for a request whose actual usage was 102 and whose prompt+cap was 783 —
  matching neither. What IS observed: Groq answers HTTP 413 `rate_limit_exceeded` when
  `prompt + declared cap` exceeds the 8K TPM window, so the declared cap does participate
  in admission even though its effect on accounting is unresolved.
- **A continuation usually re-emits the words around the cut.** Appending it verbatim
  ships a visible seam (`…ligeras parabases de datos ligeras para…`, measured live).
  `trimSeamOverlap()` in `provider.ts` drops the repeated run and is applied in `chat.ts`
  before anything reaches the client; the `[chat] completion truncated:` log carries
  `seamTrims` so the rate stays measurable.
- The knowledge base is read once per process from
  `assets/agent-knowledge/knowledge-base-complete.md`, resolved from **`process.cwd()`** and
  cached in a module-level variable. Tests that touch it depend on that path; a missing file
  makes the route answer 503.
- Gated by `NEXT_PUBLIC_AI_CHAT_ENABLED` (checked in `src/pages/index.tsx`); the widget is
  loaded with `next/dynamic` + `ssr: false`.
- `AI_PROVIDER_API_KEY` is **server-only**. Never prefix it with `NEXT_PUBLIC_`.
  `.env.example` is the source of truth for every env var.
- **`docs/sdd/ai-agent-portfolio-design.md` is the as-built authority** for this feature and
  supersedes `README.md`.

## Notes

- `tsconfig.json` sets `strict: false` — type errors will not fail the build. Be deliberate.
- `next.config.mjs` enables Turbopack and `transpilePackages: ["geist"]`.
- Version skew: Next 16 with `eslint-config-next` 14 and `@next/eslint-plugin-next` 13. Lint works,
  but the rules are calibrated to an older Next major.
- Worktrees are not banned (the old ContentLayer reason is obsolete), but `.velite/` and
  `node_modules/` are per-checkout, so each worktree needs its own `npm install` + `npx velite`.
- `.agents/skills/` holds `next-best-practices` and `vercel-react-best-practices` (plus `bmad-*`);
  `.atl/skill-registry.md` is the index. Load the relevant one before UI/Next.js work.
- `odd/tasks/` holds in-repo feature documents for tracked multi-step work.
- `opencode.json`: `default_agent` is `gentle-orchestrator`; the `gentleman` primary agent loads
  this file as its prompt.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
