import React from "react";
import type { ReactNode } from "react";

export interface IViewportBox {
  top: number;
  height: number;
}

interface IChatViewportProps {
  /**
   * Visual viewport measurement, or null before the client has one. A null box
   * renders the same markup the server produced, so hydrating does not shift
   * the layout.
   */
  box: IViewportBox | null;
  /** Chrome pinned above the surface (the site header). */
  header?: ReactNode;
  children: ReactNode;
}

/**
 * Fullscreen surface for the `/chat` page.
 *
 * Two layers on purpose:
 * - the outer one covers the whole layout viewport with an opaque app
 *   background, so nothing from the site can ever show through — not even the
 *   sliver iOS leaves when its own toolbar sits above the page;
 * - the inner one tracks the visual viewport, because on iOS the layout
 *   viewport does not resize when the keyboard opens: the visual viewport
 *   shrinks and scrolls instead.
 *
 * The header is a child of the pinned box, never a sibling of it: the site
 * nav has to move with the surface or it scrolls away under the keyboard.
 */
export const ChatViewport = ({ box, header, children }: IChatViewportProps) => (
  <div className="fixed inset-0 z-30 overflow-hidden bg-background">
    <div
      className="absolute inset-x-0 flex flex-col"
      style={{
        top: box ? `${box.top}px` : 0,
        height: box ? `${box.height}px` : "100dvh",
      }}
    >
      {header}
      {children}
    </div>
  </div>
);

export default ChatViewport;
