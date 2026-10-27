import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  LANG_STORAGE_KEY,
  readStoredLanguage,
} from "@/components/Molecules/ChatWidget/language";
import { useChatSession } from "@/components/Molecules/ChatWidget/useChatSession";
import type { IChatSession } from "@/components/Molecules/ChatWidget/useChatSession";
import type { ILang } from "@/components/Molecules/ChatWidget/types";

interface IChatSessionContext {
  session: IChatSession;
  language: ILang;
}

const ChatSessionContext = createContext<IChatSessionContext | null>(null);

/**
 * Owns the assistant conversation for the whole session.
 *
 * Mounted in `_app`, above the router outlet, so the thread survives route
 * changes: the mobile launcher navigates from `/` to `/chat`, and a session
 * living inside either page would be destroyed by that navigation (or by a
 * breakpoint crossing that swaps shells). Here the conversation, the composer
 * text and any in-flight stream outlive the views that display them; the abort
 * only fires when the app itself unmounts.
 */
export const ChatSessionProvider = ({ children }: { children: ReactNode }) => {
  const [language] = useState<ILang>(readStoredLanguage);
  const session = useChatSession(language);

  useEffect(() => {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, language);
    } catch {
      // Ignore quota/private-mode failures.
    }
  }, [language]);

  return (
    <ChatSessionContext.Provider value={{ session, language }}>
      {children}
    </ChatSessionContext.Provider>
  );
};

export function useChatSessionContext(): IChatSessionContext {
  const context = useContext(ChatSessionContext);
  if (!context) {
    throw new Error(
      "useChatSessionContext must be used inside ChatSessionProvider"
    );
  }
  return context;
}
