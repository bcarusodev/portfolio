import React from "react";
import { cn } from "@/lib/utils";
import type { Components } from "react-markdown";

/**
 * Tailwind overrides for react-markdown elements (FR-1 / NFR-6).
 *
 * Every class binds to existing HSL theme tokens (`foreground`,
 * `muted-foreground`, `border`, `primary`, `background`, `font-mono`)
 * so light/dark mode adapts with zero hardcoded colors.
 */
export const markdownComponents: Components = {
  h1: ({ node, className, children, ...props }) => (
    <h1
      className={cn(
        "mt-3 first:mt-0 text-lg font-semibold text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ node, className, children, ...props }) => (
    <h2
      className={cn(
        "mt-3 first:mt-0 text-base font-semibold text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ node, className, children, ...props }) => (
    <h3
      className={cn(
        "mt-3 first:mt-0 text-sm font-semibold text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ node, className, children, ...props }) => (
    <p className={cn("my-1.5 first:mt-0 last:mb-0", className)} {...props}>
      {children}
    </p>
  ),
  strong: ({ node, className, children, ...props }) => (
    <strong className={cn("font-semibold", className)} {...props}>
      {children}
    </strong>
  ),
  em: ({ node, className, children, ...props }) => (
    <em className={cn("italic", className)} {...props}>
      {children}
    </em>
  ),
  ul: ({ node, className, children, ...props }) => (
    <ul
      className={cn(
        "my-1.5 space-y-1 pl-5",
        typeof className === "string" &&
          className.includes("contains-task-list")
          ? "list-none pl-1"
          : "list-disc",
        className
      )}
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ node, className, children, ...props }) => (
    <ol
      className={cn("my-1.5 list-decimal space-y-1 pl-5", className)}
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ node, className, children, ...props }) => (
    <li
      className={cn(
        "leading-relaxed",
        typeof className === "string" &&
          className.includes("contains-task-item") &&
          "list-none",
        className
      )}
      {...props}
    >
      {children}
    </li>
  ),
  code: ({ node, className, children, ...props }) => (
    <code
      className={cn(
        "rounded border border-border/60 bg-background/60 px-1 font-mono text-xs",
        className
      )}
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ node, className, children, ...props }) => (
    <pre
      className={cn(
        "my-2 overflow-x-auto rounded-lg border border-border/60 bg-background p-3 font-mono text-xs",
        "[&_code]:border-0 [&_code]:bg-transparent [&_code]:px-0 [&_code]:text-inherit",
        className
      )}
      {...props}
    >
      {children}
    </pre>
  ),
  a: ({ node, className, children, ...props }) => (
    <a
      className={cn(
        "text-primary underline underline-offset-4 hover:opacity-80",
        className
      )}
      {...props}
    >
      {children}
    </a>
  ),
  blockquote: ({ node, className, children, ...props }) => (
    <blockquote
      className={cn(
        "my-1.5 border-l-2 border-border pl-3 italic text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </blockquote>
  ),
  hr: ({ node, className, ...props }) => (
    <hr className={cn("my-2 border-t border-border", className)} {...props} />
  ),
  table: ({ node, className, children, ...props }) => (
    <table
      className={cn(
        "my-2 w-full border-collapse border border-border/60 text-xs",
        className
      )}
      {...props}
    >
      {children}
    </table>
  ),
  th: ({ node, className, children, ...props }) => (
    <th
      className={cn(
        "border border-border/60 bg-background/60 px-2 py-1 text-left font-semibold",
        className
      )}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ node, className, children, ...props }) => (
    <td
      className={cn("border border-border/60 px-2 py-1 text-left", className)}
      {...props}
    >
      {children}
    </td>
  ),
  img: ({ node, className, ...props }) => (
    // Arbitrary model URLs lack remotePatterns, so plain <img> stays
    // unoptimized on purpose (chat-only surface).
    // eslint-disable-next-line @next/next/no-img-element
    <img className={cn("my-2 max-w-full rounded", className)} {...props} />
  ),
  // remark-gfm emits a disabled native checkbox for task lists; style it
  // and mark it readOnly so React does not warn about a controlled input
  // without onChange.
  input: ({ node, className, checked, ...props }) => (
    <input
      checked={checked}
      readOnly={checked !== undefined}
      className={cn(
        "mr-1.5 h-3.5 w-3.5 align-middle accent-primary",
        className
      )}
      {...props}
    />
  ),
};
