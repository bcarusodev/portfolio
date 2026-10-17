import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  markdownComponents,
  withLineBreaks,
} from "@/components/Molecules/ChatWidget/markdownComponents";

const el = React.createElement;

const renderMarkdown = (content: string): string =>
  renderToStaticMarkup(
    el(ReactMarkdown, {
      remarkPlugins: [remarkGfm],
      components: markdownComponents,
      children: content,
    })
  );

describe("withLineBreaks", () => {
  it("passes plain strings through unchanged", () => {
    expect(withLineBreaks("no breaks here")).toBe("no breaks here");
  });

  it("passes non-string, non-array nodes through unchanged", () => {
    const node = el("strong", null, "x");
    expect(withLineBreaks(node)).toBe(node);
  });

  it("replaces <br>, <br/> and <BR /> variants with real break elements", () => {
    const html = renderToStaticMarkup(
      el("div", null, withLineBreaks("a<br>b<br/>c<BR />d") as React.ReactNode)
    );
    expect(html).toBe("<div>a<br/>b<br/>c<br/>d</div>");
  });

  it("recurses into arrays and keeps sibling elements", () => {
    const html = renderToStaticMarkup(
      el(
        "div",
        null,
        withLineBreaks([
          "left<br>right",
          el("strong", { key: "s" }, "bold"),
        ]) as React.ReactNode
      )
    );
    expect(html).toBe("<div>left<br/>right<strong>bold</strong></div>");
  });
});

describe("markdownComponents + escaped model <br>", () => {
  // react-markdown escapes raw HTML by default (no rehype-raw): the model's
  // <br> arrives as literal text. The td/th/p/li overrides must turn those
  // text nodes into real breaks — regression for the GFM table cell case.
  it("renders model-emitted <br> inside a table cell as real line breaks", () => {
    const html = renderMarkdown(
      "| Role | Highlights |\n| --- | --- |\n| Dev | bullet one<br>bullet two |"
    );
    expect(html).toContain("<td");
    expect(html).toContain("bullet one<br/>bullet two");
    expect(html).not.toContain("&lt;br");
  });

  it("renders model-emitted <br> inside a paragraph", () => {
    const html = renderMarkdown("line one<br>line two");
    expect(html).toContain("line one<br/>line two");
    expect(html).not.toContain("&lt;br");
  });

  it("renders model-emitted <br> inside a list item", () => {
    const html = renderMarkdown("- item one<br>still item one");
    expect(html).toContain("<br/>");
    expect(html).not.toContain("&lt;br");
  });

  it("leaves text without <br> untouched", () => {
    const html = renderMarkdown("just **bold** text");
    expect(html).not.toContain("<br");
    expect(html).toContain('<strong class="font-semibold">bold</strong>');
  });
});
