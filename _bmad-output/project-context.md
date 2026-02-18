---
project_name: "portfolio"
user_name: "Brunocaruso"
date: "2026-02-18"
sections_completed:
  [
    "technology_stack",
    "language_specific_rules",
    "framework_specific_rules",
    "testing_rules",
    "code_quality_rules",
    "workflow_rules",
    "critical_rules",
  ]
status: "complete"
rule_count: 42
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Next.js**: 16.1.6 (Pages Router - NOT App Router)
- **React**: 18.2.0
- **TypeScript**: 5.9.3 (strict: false)
- **Node.js**: 18+ required

**Styling & UI:**

- Tailwind CSS 3.4.17 with custom theme extensions
- Chakra UI components for layout
- Radix UI primitives
- Geist font family

**Content Management:**

- ContentLayer 0.3.0 for markdown content
- Content directory: `data/`
- Generated files in `.contentlayer/` (DO NOT use git worktrees)

**Key Libraries:**

- Framer Motion 8.4.3 / Motion 12.0.6 for animations
- Lucide React 0.474.0 for icons
- class-variance-authority 0.7.1 for component variants

**Build Tools:**

- ESLint 8.57.1 (standard, prettier, next/recommended)
- Prettier 2.8.3
- Husky 8.0.3 + lint-staged 13.1.0

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

- **Strict mode is OFF**: `strict: false` in tsconfig.json - do not enforce strict type checking
- **Use path aliases**: Always use `@/*` for src imports, `@data/*` for data imports
  - ✅ `import { Button } from "@/components/ui/button"`
  - ❌ `import { Button } from "../../components/ui/button"`
- **Avoid `any`**: Use `unknown` when type is truly unknown
- **Explicit types**: Use explicit types for function parameters and return values when not obvious
- **Interface vs Type**: Use `interface` for object shapes, `type` for unions/intersections
- **Forward refs**: Use `React.forwardRef` with `displayName` set for ref-forwarding components

### Framework-Specific Rules (React/Next.js)

**Architecture:**

- **Pages Router ONLY**: This project uses Next.js Pages Router, NOT App Router
- **Atomic Design pattern**: Organize components in Atoms/Molecules/Organisms hierarchy
- **Component location**:
  - `src/components/Atoms/` - smallest reusable components
  - `src/components/Molecules/` - composed from atoms
  - `src/components/Organisms/` - complex UI sections
  - `src/components/ui/` - shadcn/ui style primitives

**Component Patterns:**

- Use `React.forwardRef` for components that need ref forwarding
- Always set `displayName` on forwarded ref components
- Use `cva` (class-variance-authority) for component variants
- Use `cn()` utility from `@/lib/utils` for conditional Tailwind classes

**ContentLayer Integration:**

- Markdown content stored in `data/` directory
- ContentLayer generates types in `.contentlayer/generated`
- DO NOT use git worktrees (breaks ContentLayer caching)

### Testing Rules

- **NO TESTS**: There is no test suite configured - do NOT add tests unless explicitly requested by the user
- If tests are needed in the future, discuss testing framework choice with user first
- Do not generate test files or testing infrastructure without explicit permission

### Code Quality & Style Rules

**ESLint Configuration:**

- Extends: `plugin:react/recommended`, `standard`, `prettier`, `plugin:@next/next/recommended`
- `react/react-in-jsx-scope`: OFF (JSX runtime is automatic)
- `react/prop-types`: OFF for UI components in `src/components/ui/`
- `no-undef`: OFF for TypeScript files

**Pre-commit Hooks:**

- Husky 8.0.3 with lint-staged 13.1.0
- Prettier runs on all files before commit
- Command: `prettier --write --ignore-unknown`

**Naming Conventions:**

- Components: PascalCase (e.g., `NavBar`, `Button`, `ProjectCard`)
- Files: `index.tsx` for component folders, PascalCase for files
- CSS/Tailwind classes: kebab-case
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE

**Component Organization:**

- Keep components small and focused
- Use functional components with hooks
- Prefer composition over inheritance
- Use TypeScript types over `any`

**Import Patterns:**

- Use `@/*` for src directory imports
- Use `@data/*` for data directory imports
- Never use relative paths like `../../components`

### Development Workflow Rules

**Git Workflow:**

- DO NOT use git worktrees (ContentLayer breaks with worktrees)
- Use feature branches: `git checkout -b feature/my-feature`
- Standard commit workflow: add → commit → push

**Build Commands:**

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- `npm run prepare` - Install Husky hooks

**Pre-commit Process:**

- lint-staged runs Prettier on all staged files
- ESLint checks for code quality issues
- No tests run automatically (no test suite)

**ContentLayer Considerations:**

- Generated files in `.contentlayer/` directory
- Don't commit generated files
- Restart dev server if content types change

### Critical Don't-Miss Rules

**NEVER DO These:**

1. **Don't add tests** - There is NO test suite. Don't create test files or testing infrastructure unless explicitly requested.

2. **Don't use App Router** - This is Pages Router ONLY. All pages go in `src/pages/`, not `app/`.

3. **Don't enable strict mode** - TypeScript strict mode is OFF. Don't add strict type checking.

4. **Don't use git worktrees** - ContentLayer breaks with worktrees. Always work in the main directory.

5. **Don't forget displayName** - All forwarded ref components MUST set `displayName`.

6. **Don't use relative imports** - Always use `@/*` or `@data/*` path aliases.

7. **Don't modify ContentLayer generated files** - Files in `.contentlayer/` are auto-generated.

**Critical Patterns to Follow:**

1. **Always use `cn()` utility** - For conditional Tailwind classes, use `cn()` from `@/lib/utils`
2. **Always use `cva`** - For component variants, use class-variance-authority
3. **Always forward refs** - Components needing refs must use `React.forwardRef`
4. **Always check strict mode** - Remember `strict: false` in tsconfig.json
5. **Always run lint** - Use `npm run lint` before committing

**Edge Cases to Handle:**

- ContentLayer type generation may need dev server restart
- Husky hooks require `npm run prepare` after fresh install
- Next.js 16 with ContentLayer may have build caching issues

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-02-18
