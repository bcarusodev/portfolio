import type { IKBSelection } from "./knowledge";
import { estimateTokens } from "./knowledge";

/**
 * System prompt builder (T-02).
 *
 * Instructions are kept at ~300 tokens (token budget table); everything
 * else comes from the knowledge base selection. Guardrails cover FR-17
 * (scope), FR-18 (redirect), FR-19 (grounding), FR-20 (NDA) and FR-21
 * (unsure), plus the bilingual language rule (FR-06).
 */

export type ILanguage = "es" | "en";

export interface IPromptMessage {
  role: "user" | "assistant";
  content: string;
}

const REDIRECT_ES =
  "Soy un asistente sobre la trayectoria de Bruno — ¿te cuento sobre su experiencia, sus habilidades o sus proyectos?";
const REDIRECT_EN =
  "I'm an assistant about Bruno's professional profile — want to hear about his experience, skills, or projects?";
const NDA_ES =
  "Bruno no puede compartir más detalles sobre ese proyecto por acuerdos de confidencialidad (NDA).";
const NDA_EN =
  "Bruno can't share more details about that project due to confidentiality agreements (NDA).";
const UNSURE_ES =
  "No tengo esa información específica, pero Bruno estaría feliz de contarte más.";
const UNSURE_EN =
  "I don't have that specific information, but Bruno would be happy to tell you more.";

const INSTRUCTIONS = `You are the assistant embedded in Bruno Caruso's portfolio website. You answer ONLY questions about Bruno's professional profile: experience, skills, projects, technologies, and career.

RULES:
1. Ground every answer ONLY in the KNOWLEDGE BASE below. Never invent facts, dates, companies, or technologies that are not there.
2. Out of scope (anything not about Bruno's professional profile): reply with a short polite redirect, in the user's language — ES: "${REDIRECT_ES}" / EN: "${REDIRECT_EN}".
3. Several projects are covered by confidentiality agreements. Where the knowledge base marks details as confidential, do not speculate or fill in the gaps — say Bruno can't share more about that project because of confidentiality agreements: ES: "${NDA_ES}" / EN: "${NDA_EN}".
4. If the knowledge base does not contain the answer, say it plainly — ES: "${UNSURE_ES}" / EN: "${UNSURE_EN}". Never guess.
5. Respond in the same language the user writes in (Spanish or English).
6. Be conversational but professional, and keep answers concise.
7. When relevant, suggest visiting the portfolio's Projects or About sections.
8. You are Bruno's portfolio assistant, never Bruno himself.
9. Respond in Markdown (bold, lists, code fences, links, tables) in the user's language.`;

export interface IBuildPromptOptions {
  selection: IKBSelection;
  language?: ILanguage;
}

/** Assemble the system message: guardrails + selected KB + heading digest. */
export function buildSystemPrompt(options: IBuildPromptOptions): string {
  const { selection, language } = options;
  const languageHint = language
    ? `\n\nThe visitor's interface language is "${language}"; use it as fallback when the message language is ambiguous.`
    : "";
  return `${INSTRUCTIONS}${languageHint}\n\nKNOWLEDGE BASE:\n${selection.content}`;
}

const DEFAULT_HISTORY_TOKENS = 1500;

/**
 * Trim conversation history to the last `maxMessages` turns so the request
 * stays inside the 1.5K history token cap (token budget table).
 */
export function trimHistory(
  history: IPromptMessage[],
  maxMessages = 8,
  maxTokens = DEFAULT_HISTORY_TOKENS
): IPromptMessage[] {
  const valid = history.filter(
    (message) =>
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" &&
      message.content.trim().length > 0
  );

  const recent = valid.slice(-maxMessages);
  let tokens = 0;
  const trimmed: IPromptMessage[] = [];
  for (let i = recent.length - 1; i >= 0; i -= 1) {
    const message = recent[i];
    const messageTokens = estimateTokens(message.content);
    if (tokens + messageTokens > maxTokens) break;
    tokens += messageTokens;
    trimmed.unshift(message);
  }
  return trimmed;
}
