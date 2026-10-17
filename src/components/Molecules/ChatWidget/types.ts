/** Shared chat widget types. */

export type ILang = "es" | "en";

export type IChatRole = "user" | "assistant";

export interface IChatMessage {
  id: string;
  role: IChatRole;
  content: string;
}

/** idle: nothing running · thinking: request in flight, no token yet. */
export type IChatStatus = "idle" | "thinking" | "streaming" | "error";

export type IChatErrorCode =
  | "rate_limit"
  | "network"
  | "provider"
  | "invalid"
  | "too_long"
  | "truncated"
  | "unknown";
