import { afterEach, describe, expect, it } from "vitest";
import { LANG_STORAGE_KEY, readStoredLanguage } from "./language";

interface IStubBrowser {
  stored?: string | null;
  browserLanguage?: string;
  storageThrows?: boolean;
}

/** Installs a minimal `window` so the node test environment can exercise it. */
function stubBrowser({
  stored = null,
  browserLanguage = "en-US",
  storageThrows = false,
}: IStubBrowser = {}) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: {
      localStorage: {
        getItem: (key: string) => {
          expect(key).toBe(LANG_STORAGE_KEY);
          if (storageThrows) throw new Error("storage blocked");
          return stored;
        },
      },
      navigator: { language: browserLanguage },
    },
  });
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe("readStoredLanguage", () => {
  it("returns en when there is no browser window", () => {
    expect(readStoredLanguage()).toBe("en");
  });

  it("returns the stored language", () => {
    stubBrowser({ stored: "es", browserLanguage: "en-US" });
    expect(readStoredLanguage()).toBe("es");
  });

  it("prefers the stored language over the browser language", () => {
    stubBrowser({ stored: "en", browserLanguage: "es-AR" });
    expect(readStoredLanguage()).toBe("en");
  });

  it("falls back to the browser language when the stored value is unknown", () => {
    stubBrowser({ stored: "fr", browserLanguage: "es-AR" });
    expect(readStoredLanguage()).toBe("es");
  });

  it("falls back to the browser language when storage throws", () => {
    stubBrowser({ storageThrows: true, browserLanguage: "es-ES" });
    expect(readStoredLanguage()).toBe("es");
  });
});
