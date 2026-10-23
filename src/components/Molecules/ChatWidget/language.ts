import type { ILang } from "./types";

/** localStorage key that remembers the visitor's chat language. */
export const LANG_STORAGE_KEY = "chat-lang:v1";

/**
 * Resolves the chat UI language: an explicit stored choice first, then the
 * browser preference. Outside the browser (or when storage is blocked) it
 * falls back to `en`.
 *
 * Shared by the widget and its launcher so both render the same language.
 */
export function readStoredLanguage(): ILang {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "es" || stored === "en") return stored;
  } catch {
    // localStorage unavailable (private mode) — fall through.
  }
  return window.navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}
