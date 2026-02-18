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
  ]
existing_patterns_found: 35
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
