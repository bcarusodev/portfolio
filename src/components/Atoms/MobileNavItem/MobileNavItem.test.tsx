import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MobileNavItem } from "./index";

/**
 * Structural contract (node environment, no jsdom).
 *
 * Computed vertical rhythm cannot be measured here, so the value is pinning
 * the two decisions that made the mobile drawer feel airy: the link keeps at
 * least a 44px touch target (label 28px + py-2), and the item contributes no
 * extra vertical margin of its own — the gap is owned by the drawer list.
 */

vi.mock("next/router", () => ({
  useRouter: () => ({ pathname: "/work", asPath: "/work", query: {} }),
}));

function classesOf(html: string): string[] {
  const classes: string[] = [];
  const pattern = /class="([^"]*)"/g;
  let match = pattern.exec(html);

  while (match !== null) {
    match[1]
      .split(/\s+/)
      .filter(Boolean)
      .forEach((name) => classes.push(name));
    match = pattern.exec(html);
  }

  return classes;
}

describe("MobileNavItem spacing", () => {
  it("keeps a 44px touch target instead of taller per-item padding", () => {
    const classes = classesOf(
      renderToStaticMarkup(<MobileNavItem label="Work" href="/work" />)
    );

    expect(classes.indexOf("py-2") >= 0).toBe(true);
    expect(classes.indexOf("py-3") >= 0).toBe(false);
  });

  it("adds no vertical margin of its own", () => {
    const html = renderToStaticMarkup(
      <MobileNavItem label="Work" href="/work" />
    );
    // Any space-y-* here adds margin to the collapsed submenu panel, which has
    // max-h-0: pure dead space between items.
    const spaceUtilities = classesOf(html).filter(
      (name) => name.indexOf("space-y-") === 0
    );

    expect(spaceUtilities).toEqual([]);
    expect(html).not.toContain("margin-top:0!important");
  });
});
