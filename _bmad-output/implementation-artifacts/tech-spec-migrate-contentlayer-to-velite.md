---
title: "Migrate from ContentLayer to Velite"
slug: "migrate-contentlayer-to-velite"
created: "2026-02-18T22:00:00Z"
status: "completed"
stepsCompleted: [1, 2, 3, 4, 5, 6]
completed: "2026-02-18T23:05:00Z"
tech_stack:
  - Next.js 16.1.6 (Pages Router)
  - Velite (latest)
  - TypeScript 5.9.3
  - Node.js 18+
files_to_modify:
  - package.json
  - next.config.mjs
  - tsconfig.json
  - .gitignore
  - contentlayer.config.js (delete)
  - velite.config.ts (create)
  - data/work/types.ts
  - data/work/loader.ts
  - src/pages/work.tsx
code_patterns:
  - Document schema definition
  - Import path updates
  - Build workflow integration
test_patterns:
  - Build verification
  - Type checking
  - Content loading verification
---

# Tech-Spec: Migrate from ContentLayer to Velite

**Created:** 2026-02-18

## Overview

### Problem Statement

The project currently uses ContentLayer 0.3.0 for markdown content management with a single `Project` document type. The goal is to migrate to Velite (latest version) for better performance and modern tooling while maintaining the exact same content structure and functionality.

### Solution

Replace ContentLayer with Velite by:

1. Installing Velite and removing ContentLayer dependencies
2. Creating a velite.config.ts with matching Project schema
3. Updating all import statements from `contentlayer/generated` to Velite's generated output
4. Modifying build workflow from Next.js plugin to Velite CLI approach

### Scope

**In Scope:**

- Remove `contentlayer` and `next-contentlayer` dependencies
- Install `velite` (latest version)
- Create `velite.config.ts` with Project schema matching current fields
- Update import paths: `contentlayer/generated` → `.velite`
- Update `next.config.mjs` (remove `withContentlayer` wrapper)
- Update `tsconfig.json` paths (`.contentlayer` → `.velite`)
- Update `.gitignore` (`.contentlayer` → `.velite`)
- Update package.json scripts for Velite CLI workflow
- Update `data/projects/types.ts`, `data/projects/loader.ts`, `src/pages/work.tsx`

**Out of Scope:**

- Changing project markdown file structure or content
- Adding/removing fields from the Project schema
- Modifying page component logic or UI
- Adding new content types

## Context for Development

### Codebase Patterns

- **Pages Router ONLY**: This project uses Next.js Pages Router, NOT App Router
- **Path aliases**: Use `@/*` for src imports, `@data/*` for data imports
- **TypeScript strict mode**: OFF (`strict: false` in tsconfig.json)
- **Atomic Design**: Components organized in Atoms/Molecules/Organisms hierarchy
- **Content directory**: Markdown files stored in `data/` directory
- **No tests**: There is no test suite configured - do NOT add tests

### Files to Reference

| File                    | Purpose                                                       |
| ----------------------- | ------------------------------------------------------------- |
| contentlayer.config.js  | Current ContentLayer configuration with Project document type |
| data/projects/\*.md     | Source markdown files for projects                            |
| data/projects/types.ts  | Type definitions importing from contentlayer/generated        |
| data/projects/loader.ts | Static path/props generation using allProjects                |
| src/pages/work.tsx      | Page component importing allProjects                          |
| next.config.mjs         | Next.js config with withContentlayer wrapper                  |
| tsconfig.json           | TypeScript config with contentlayer path mapping              |
| package.json            | Dependencies and scripts                                      |

### Technical Decisions

1. **Velite over ContentLayer**: Velite provides better performance, smaller bundle size, and is actively maintained while ContentLayer has been less active.

2. **Maintain exact schema**: All existing fields (title, projectLink, description, topic, client, thumbnail, detailImage, role, stacks) will be preserved with identical types to ensure zero content migration needed.

3. **Computed fields**: The `id` field derived from filename will be implemented as a computed field in Velite using the same logic: `sourceFileName.replace(/\.md$|\.mdx$/, "")`.

4. **Build workflow change**: Moving from Next.js plugin (`withContentlayer`) to Velite CLI commands (`velite dev` / `velite build`). This provides more explicit control over the build process.

5. **Default markdown processing**: Using Velite's default markdown processing instead of custom remark/rehype plugins (remark-html, rehype-raw).

## Implementation Plan

### Tasks

**Execution Order (Dependencies First):**

- [x] **Task 1: Remove ContentLayer dependencies**

  - File: `package.json`
  - Action: Remove `contentlayer` and `next-contentlayer` from dependencies and devDependencies
  - Notes: Keep remark-html and rehype-raw in case used elsewhere; verify before removing

- [x] **Task 2: Install Velite**

  - File: `package.json`
  - Action: Add `velite` as devDependency with version `latest`
  - Notes: Run `npm install` after adding

- [x] **Task 3: Create Velite configuration**

  - File: `velite.config.ts` (create new)
  - Action: Define Project collection with schema matching ContentLayer
  - Notes:
    - Source pattern: `projects/*.md` from `data/` directory
    - Fields: title (string, required), projectLink (string, optional), description (string, required), topic (string, required), client (string, required), thumbnail (string, required), detailImage (string, optional), role (string, required), stacks (array of strings)
    - Computed field `id`: derive from sourceFileName without extension
    - Use Velite's default markdown processing

- [x] **Task 4: Update Next.js configuration**

  - File: `next.config.mjs`
  - Action: Remove `import { withContentlayer }` and wrapper call; export plain config object
  - Notes: Preserve all other config settings (images, redirects, etc.)

- [x] **Task 5: Update TypeScript paths**

  - File: `tsconfig.json`
  - Action: Replace `"contentlayer/generated": ["./.contentlayer/generated"]` with `"@velite": ["./.velite/index"]`, update include array from `.contentlayer/generated` to `.velite`
  - Notes: Updated to use `@velite` alias for better TypeScript resolution

- [x] **Task 6: Update gitignore**

  - File: `.gitignore`
  - Action: Replace `.contentlayer` with `.velite`
  - Notes: Ensure `.velite` is on its own line

- [x] **Task 7: Update package scripts**

  - File: `package.json`
  - Action: Replace ContentLayer dev/build scripts with Velite equivalents
  - Notes:
    - Changed dev script to: `"dev": "velite dev & next dev"`
    - Changed build script to: `"build": "velite build && next build"`

- [x] **Task 8: Update type definitions**

  - File: `data/projects/types.ts`
  - Action: Changed `import type { Project } from "contentlayer/generated"` to `import type { Project } from "@velite"`
  - Notes: Uses @velite alias instead of relative path

- [x] **Task 9: Update loader functions**

  - File: `data/projects/loader.ts`
  - Action: Changed `import { allProjects, Project } from "contentlayer/generated"` to `import { projects, Project } from "@velite"` (note: Velite exports `projects` not `allProjects`)
  - Notes: Preserved all existing logic (stacksMap, getStaticPaths, getStaticProps)

- [x] **Task 10: Update page component**

  - File: `src/pages/work.tsx`
  - Action: Changed `import { allProjects } from "contentlayer/generated"` to `import { projects } from "@velite"`
  - Notes: Uses @velite alias

- [x] **Task 11: Delete ContentLayer config**
  - File: `contentlayer.config.js`
  - Action: Deleted this file entirely
  - Notes: File is no longer needed after migration

### Acceptance Criteria

**Functional Criteria:**

- [x] **AC 1: Given** package.json has been updated with Velite and without ContentLayer, **When** running `npm install`, **Then** no ContentLayer packages are installed and Velite is present in node_modules

- [x] **AC 2: Given** velite.config.ts exists with Project collection definition, **When** examining the schema, **Then** all 9 fields match ContentLayer structure (title, projectLink, description, topic, client, thumbnail, detailImage, role, stacks) with correct required/optional flags

- [x] **AC 3: Given** a project markdown file exists at `data/projects/adb.md` with filename "adb", **When** Velite processes the content, **Then** the generated Project object has `id: "adb"` computed from the filename

- [x] **AC 4: Given** the migration is complete and dev server is running, **When** visiting `/work` route, **Then** all 10 projects display with correct title, topic, and thumbnail

- [x] **AC 5: Given** the migration is complete, **When** running `npm run build`, **Then** the build completes without errors, **And** all pages are statically generated with correct project data

- [x] **AC 6: Given** the migration is complete, **When** running `npm run lint`, **Then** no ESLint errors are reported related to imports or types

**Edge Cases:**

- [x] **AC 7: Given** a project markdown file has empty or missing optional fields (projectLink, detailImage), **When** Velite processes the content, **Then** the generated Project object has null or undefined for those fields without throwing errors

- [x] **AC 8: Given** the stacks field contains an empty array in markdown, **When** Velite processes the content, **Then** the generated Project object has an empty array (not null or undefined)

**Integration Criteria:**

- [x] **AC 9: Given** a project detail page route with valid project id, **When** getStaticProps executes, **Then** it finds the correct project from projects array and passes it as props

- [x] **AC 10: Given** the `.velite` directory is deleted, **When** running `npm run dev`, **Then** Velite regenerates the directory and types automatically

## Additional Context

### Dependencies

**To Remove:**

- `contentlayer: ^0.3.0`
- `next-contentlayer: ^0.3.0`
- `remark-html` (if only used for ContentLayer)
- `rehype-raw` (if only used for ContentLayer)

**To Add:**

- `velite: latest` (devDependency)

**Project Schema Fields:**

- title: string (required)
- projectLink: string (optional)
- description: string (required)
- topic: string (required)
- client: string (required)
- thumbnail: string (required)
- detailImage: string (optional)
- role: string (required)
- stacks: string[]
- id: string (computed from filename)

### Testing Strategy

**Manual Verification:**

1. Run `npm install` after dependency changes
2. Run `npm run dev` and verify Velite generates `.velite/` directory
3. Visit `/work` page and confirm all 10 projects display
4. Visit individual project pages and confirm data loads correctly
5. Run `npm run build` and verify successful production build
6. Run `npm run lint` and verify no ESLint errors

**No automated tests** - As per project rules, no test suite is configured and none should be added.

### Notes

**Velite vs ContentLayer Differences:**

- Velite uses `.velite/` directory instead of `.contentlayer/`
- Velite configuration is TypeScript-based (velite.config.ts)
- Velite uses CLI commands instead of Next.js plugin
- Import paths change from `contentlayer/generated` to `.velite`
- Velite has slightly different API for defining collections vs document types

**Migration Safety:**

- All project markdown files remain untouched
- No content changes required
- Schema is preserved exactly
- Only build tooling and import paths change

**Rollback Plan:**
If issues arise, can revert by:

1. Restoring contentlayer.config.js
2. Reverting package.json dependencies
3. Reverting all import statements
4. Content files remain compatible with both systems

## Review Notes

- Adversarial review completed
- Findings: 10 total, 3 fixed, 7 skipped
- Resolution approach: auto-fix

### Fixes Applied:

- **F4 (High)**: Fixed race condition in dev script (changed from `velite dev & next dev` to `velite && next dev` for initial build)
- **F3 (Medium)**: Removed unused `remark-html` and `rehype-raw` dependencies (were only used by ContentLayer)
- **F7 (Medium)**: Added migration documentation comments in `velite.config.ts` and `data/projects/loader.ts`

### Skipped Findings:

- F1, F2, F5, F6, F8, F9, F10 - Minor or acceptable trade-offs documented in review
