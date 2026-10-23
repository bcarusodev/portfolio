import { afterEach, describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ChatWidget from "./index";
import ChatLauncher from "./ChatLauncher";
import type { IChatSession } from "./useChatSession";

/**
 * Structural contract tests (node environment, no jsdom).
 *
 * The dialog itself cannot run here — Radix needs a real `document` — so the
 * value is pinning the shells' markup: the desktop card must stay exactly as
 * it was, the fullscreen shell must fill its container, and only one widget
 * instance may ever be mounted (the input id must stay unique). The session is
 * supplied as data, which is possible because the widget is presentational.
 */

const INPUT_ID = "assistant-input";

const INLINE_SECTION_CLASS =
  "w-full overflow-hidden rounded-2xl border border-border-strong bg-background/70 shadow-lg backdrop-blur-md";
const INLINE_LOG_CLASS =
  "flex max-h-[420px] min-h-[240px] flex-col gap-3 overflow-y-auto px-4 py-4";

function makeSession(overrides: Partial<IChatSession> = {}): IChatSession {
  return {
    messages: [],
    status: "idle",
    errorCode: null,
    input: "",
    setInput: () => undefined,
    submit: () => undefined,
    retry: () => undefined,
    newChat: () => undefined,
    dismissError: () => undefined,
    busy: false,
    canRetry: false,
    ...overrides,
  };
}

function stubBrowser(narrow: boolean): void {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: {
      matchMedia: () => ({
        matches: narrow,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }),
      localStorage: { getItem: () => null, setItem: () => undefined },
      navigator: { language: "en-US" },
      visualViewport: undefined,
    },
  });
}

function occurrences(html: string, needle: string): number {
  return html.split(needle).length - 1;
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe("ChatWidget inline shell", () => {
  it("keeps the desktop card and message log classes unchanged", () => {
    const html = renderToStaticMarkup(
      <ChatWidget session={makeSession()} language="en" inputId={INPUT_ID} />
    );

    expect(html).toContain(`class="${INLINE_SECTION_CLASS}"`);
    expect(html).toContain(`class="${INLINE_LOG_CLASS}"`);
    expect(occurrences(html, INPUT_ID)).toBe(1);
    expect(html).not.toContain('aria-label="Close chat"');
    expect(html).not.toContain("flex h-full w-full flex-col");
  });

  it("renders the session it is given instead of owning one", () => {
    const html = renderToStaticMarkup(
      <ChatWidget
        session={makeSession({
          messages: [
            { id: "u1", role: "user", content: "Tell me about the migration" },
            {
              id: "a1",
              role: "assistant",
              content: "It replaced ContentLayer.",
            },
          ],
        })}
        language="en"
      />
    );

    expect(html).toContain("Tell me about the migration");
    expect(html).toContain("It replaced ContentLayer.");
    expect(html).toContain('aria-label="Clear chat"');
  });
});

describe("ChatWidget fullscreen shell", () => {
  it("fills its container with a growing log and a fixed composer", () => {
    const html = renderToStaticMarkup(
      <ChatWidget
        session={makeSession()}
        language="en"
        variant="fullscreen"
        inputId={INPUT_ID}
        onClose={() => undefined}
      />
    );

    expect(html).toContain("flex h-full w-full flex-col bg-background");
    expect(html).toContain("min-h-0 max-h-[none] flex-1");
    expect(html).toContain("shrink-0 border-t border-border-strong p-3");
    expect(html).toContain('aria-label="Close chat"');
    expect(occurrences(html, INPUT_ID)).toBe(1);
    expect(html).not.toContain(INLINE_SECTION_CLASS);
  });
});

describe("chat session ownership", () => {
  it("keeps ChatWidget free of state hooks so the session outlives it", () => {
    // Calling the shell directly runs it outside React's render phase, so any
    // useState/useEffect/useRef inside would throw "Invalid hook call". That
    // would mean the conversation had moved back into the shell the dialog
    // unmounts on close.
    expect(() =>
      ChatWidget({ session: makeSession(), language: "en", inputId: INPUT_ID })
    ).not.toThrow();
  });
});

describe("ChatLauncher", () => {
  it("renders a dialog trigger instead of the widget on mobile", () => {
    stubBrowser(true);

    const html = renderToStaticMarkup(<ChatLauncher inputId={INPUT_ID} />);

    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("<button");
    expect(occurrences(html, INPUT_ID)).toBe(0);
    expect(html).not.toContain('role="log"');
  });

  it("renders exactly one inline widget on desktop", () => {
    stubBrowser(false);

    const html = renderToStaticMarkup(<ChatLauncher inputId={INPUT_ID} />);

    expect(html).toContain(`class="${INLINE_SECTION_CLASS}"`);
    expect(html).not.toContain('aria-haspopup="dialog"');
    expect(occurrences(html, INPUT_ID)).toBe(1);
  });
});
