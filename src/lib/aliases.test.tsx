import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HERO_TEXTS } from "@data/Hero";
import { cn } from "@/lib/utils";

/**
 * Guards the Vitest `resolve.alias` map and the `include` glob in
 * vitest.config.ts.
 *
 * This file is deliberately TSX: it being collected and passing is the
 * durable proof that the config's include glob really covers TSX tests.
 *
 * Vite resolves aliases by prefix, in declaration order. The `@data` entry
 * MUST stay before the bare `@` entry: reordering makes `@data/Hero`
 * resolve to `srcdata/Hero`, which fails with a confusing
 * "Cannot find package '@data/Hero'" instead of a config error.
 */
const el = React.createElement;

describe("vitest harness aliases and include glob", () => {
  it("resolves @data without it being swallowed by the @ alias", () => {
    expect(HERO_TEXTS).toContain("software developer");
  });

  it("resolves @ to src", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("collects and runs TSX test files", () => {
    expect(
      renderToStaticMarkup(el("span", { className: cn("a", "b") }, "ok"))
    ).toBe('<span class="a b">ok</span>');
  });
});
