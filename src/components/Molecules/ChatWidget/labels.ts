import type { ILang } from "./types";

/**
 * ES/EN UI strings for the chat widget (T-07 / FR-05).
 * LLM answer language is handled server-side by the system prompt.
 */

export interface IChatLabels {
  title: string;
  subtitle: string;
  placeholder: string;
  send: string;
  newChat: string;
  thinking: string;
  typing: string;
  emptyState: string;
  retry: string;
  dismiss: string;
  conversation: string;
  inputLabel: string;
  langToggle: string;
  charCount: string;
  error: Record<
    "rate_limit" | "network" | "provider" | "invalid" | "too_long" | "unknown",
    string
  >;
}

export const CHAT_LABELS: Record<ILang, IChatLabels> = {
  es: {
    title: "Asistente de Bruno",
    subtitle: "Chatbot sobre su trayectoria profesional",
    placeholder: "Escribe tu pregunta…",
    send: "Enviar",
    newChat: "Nuevo chat",
    thinking: "Pensando…",
    typing: "Escribiendo…",
    emptyState:
      "Preguntame sobre la experiencia, habilidades o proyectos de Bruno.",
    retry: "Reintentar",
    dismiss: "Cerrar",
    conversation: "Conversación con el asistente de Bruno",
    inputLabel: "Mensaje para el asistente",
    langToggle: "Cambiar idioma",
    charCount: "caracteres",
    error: {
      rate_limit:
        "Se alcanzó el límite de mensajes. Espera un momento antes de volver a intentar.",
      network: "Se cortó la conexión. Revisa tu red y prueba de nuevo.",
      provider:
        "El asistente no está disponible ahora. Prueba en unos minutos.",
      invalid: "No se pudo enviar el mensaje. Prueba de nuevo.",
      too_long: "El mensaje es demasiado largo (máximo 2000 caracteres).",
      unknown: "Algo salió mal. Prueba de nuevo.",
    },
  },
  en: {
    title: "Bruno's Assistant",
    subtitle: "AI chatbot about his career",
    placeholder: "Type your question…",
    send: "Send",
    newChat: "New chat",
    thinking: "Thinking…",
    typing: "Typing…",
    emptyState: "Ask me about Bruno's experience, skills, or projects.",
    retry: "Retry",
    dismiss: "Dismiss",
    conversation: "Conversation with Bruno's assistant",
    inputLabel: "Message for the assistant",
    langToggle: "Change language",
    charCount: "characters",
    error: {
      rate_limit:
        "Message limit reached. Please wait a moment before trying again.",
      network: "The connection dropped. Check your network and try again.",
      provider: "The assistant is unavailable right now. Try again shortly.",
      invalid: "The message could not be sent. Please try again.",
      too_long: "The message is too long (2000 characters max).",
      unknown: "Something went wrong. Please try again.",
    },
  },
};

export function getLabels(language: ILang): IChatLabels {
  return CHAT_LABELS[language];
}
