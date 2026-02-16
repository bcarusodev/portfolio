# AGENTS.md - Developer Guidelines

This file provides guidelines for agentic coding agents operating in this repository.

## Project Overview

This is a personal portfolio website built with:

- **Framework**: Next.js 15 (Pages Router)
- **Language**: TypeScript
- **UI Libraries**: Chakra UI, Tailwind CSS, Radix UI
- **Content**: ContentLayer for markdown content management
- **Design Pattern**: Atomic Design (Atoms, Molecules, Organisms)

## Build/Lint/Test Commands

### Available Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Production build         |
| `npm run start`   | Start production server  |
| `npm run lint`    | Run ESLint               |
| `npm run prepare` | Install Husky hooks      |

### Running Lint

```bash
# Run ESLint on all files
npm run lint

# Check and fix with Prettier (pre-commit hook runs automatically)
npx prettier --write --ignore-unknown .
```

**Note**: This project does not have a test suite configured. Do not add tests unless explicitly requested.

---

## Code Style Guidelines

### General Principles

- Keep components small and focused
- Use functional components with hooks
- Prefer composition over inheritance
- Use TypeScript types over `any`

### Imports & Path Aliases

This project uses path aliases configured in `tsconfig.json`:

```typescript
// Use @/* for src directory
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Use @data/* for data directory
import { NAV_ITEMS } from "@data/NavItems";
```

### File Organization

```
src/
├── components/
│   ├── Atoms/          # Smallest reusable components
│   ├── Molecules/      # Composed from atoms
│   ├── Organisms/      # Complex UI sections
│   └── ui/             # Reusable UI primitives (shadcn-style)
├── lib/                # Utilities
├── pages/              # Next.js pages (Pages Router)
├── providers/          # React context providers
└── types/              # TypeScript type definitions
```

### Naming Conventions

- **Components**: PascalCase (e.g., `NavBar`, `Button`, `ProjectCard`)
- **Files**: `index.tsx` for component folders, PascalCase for files
- **CSS/Tailwind classes**: kebab-case
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: Prefix with `I` or use descriptive names (e.g., `ButtonProps`)

### TypeScript Guidelines

- Use explicit types for function parameters and return values when not obvious
- Use `interface` for object shapes, `type` for unions/intersections
- Avoid `any` - use `unknown` when type is truly unknown
- Use optional properties (`?`) when appropriate

```typescript
// Good
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline";
  size?: "default" | "sm" | "lg";
  asChild?: boolean;
}

// Avoid
const something: any = ...
```

### React/Component Patterns

- Use `React.forwardRef` for components that need ref forwarding
- Set `displayName` for forwarded refs
- Use `cn()` utility for conditional Tailwind classes
- Use `cva` (class-variance-authority) for component variants

```typescript
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
```

### CSS & Tailwind

- Use Tailwind utility classes for styling
- Use Chakra UI components for layout (Box, Flex, Grid, etc.)
- Use custom colors from `tailwind.config.js` (e.g., `bg-primary`, `text-foreground`)
- Use `cn()` utility for conditional class merging

### Error Handling

- Use error boundaries for component failures
- Handle loading states gracefully
- Use TypeScript null checks for optional data

### Pre-commit Hooks

The project uses Husky with lint-staged:

- Prettier runs on all files before commit
- Ensure code is formatted before committing

---

## ESLint Configuration

The project extends:

- `plugin:react/recommended`
- `standard`
- `prettier`
- `plugin:@next/next/recommended`

Key rules:

- `react/react-in-jsx-scope`: off (JSX runtime is automatic)
- Prop-types disabled for UI components in `src/components/ui/`

---

## Important Notes

1. **Pages Router**: This project uses Next.js Pages Router, not App Router
2. **ContentLayer**: Markdown content is managed via ContentLayer in the `content/` directory
3. **No Tests**: There are no test files or test configuration - do not add tests
4. **Strict Mode Off**: `strict: false` is set in tsconfig.json
