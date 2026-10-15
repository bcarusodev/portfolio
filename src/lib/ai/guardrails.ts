import type { ILanguage } from "./prompt";

/**
 * Pure output guardrail validator (chatbot-guardrails design).
 *
 * Structural heuristics only: zero dependencies, no I/O (the route logs
 * failures), first-match-wins over an ordered class list. Prose mentions
 * of formats never fire because the JSON/XML/fence checks are
 * whole-response scoped; organic fences and tables beside prose stay
 * allowed (rule 9).
 */

export type TViolationClass =
  | "whole_response_json"
  | "whole_response_xml"
  | "tag_wrapping"
  | "code_fence_framing"
  | "role_claim"
  | "instruction_disclosure"
  | "oversize";

export type IGuardrailVerdict =
  | { ok: true }
  | { ok: false; violation: TViolationClass };

/** Fail-closed cap for a buffered completion (design: 16 384 chars). */
export const MAX_RESPONSE_CHARS = 16384;

/** Whole response parses as a JSON object/array (imposed-format replies). */
function isWholeResponseJson(text: string): boolean {
  const body = text.trim();
  if (!/^[[{]/.test(body)) return false;
  try {
    JSON.parse(body);
    return true;
  } catch {
    return false;
  }
}

/** Whole response is one well-formed XML root (single balanced tree). */
function isWholeResponseXml(text: string): boolean {
  const body = text.trim();
  if (!body.startsWith("<") || !body.endsWith(">")) return false;
  const stack: string[] = [];
  let roots = 0;
  let i = 0;

  while (i < body.length) {
    const lt = body.indexOf("<", i);
    if (lt === -1) break;
    // Text outside the root may only be whitespace.
    if (stack.length === 0 && body.slice(i, lt).trim().length > 0) {
      return false;
    }
    if (body.startsWith("<!--", lt)) {
      const end = body.indexOf("-->", lt + 4);
      if (end === -1) return false;
      i = end + 3;
      continue;
    }
    if (body.startsWith("<?", lt)) {
      const end = body.indexOf("?>", lt + 2);
      if (end === -1) return false;
      i = end + 2;
      continue;
    }
    const gt = body.indexOf(">", lt);
    if (gt === -1) return false;
    const tag = body.slice(lt, gt + 1);
    i = gt + 1;

    if (tag.startsWith("</")) {
      if (stack.pop() !== tag.slice(2, -1).trim()) return false;
    } else if (tag.endsWith("/>")) {
      roots += stack.length === 0 ? 1 : 0;
      if (roots > 1) return false;
    } else {
      const open = tag.match(/^<([A-Za-z][\w.:-]*)/);
      if (!open) return false;
      if (stack.length === 0) {
        roots += 1;
        if (roots > 1) return false;
      }
      stack.push(open[1]);
    }
  }

  if (stack.length !== 0) return false;
  if (body.slice(i).trim().length > 0) return false;
  return roots === 1;
}

/** One container tag wraps the whole body, even when not well-formed. */
function isTagWrapping(text: string): boolean {
  return /^<[A-Za-z][\w.:-]*(?:\s[^<>]*)?>[\s\S]*<\/[A-Za-z][\w.:-]*\s*>$/.test(
    text.trim()
  );
}

/** Body is exactly one fenced block (fences beside prose stay allowed). */
function isCodeFenceFraming(text: string): boolean {
  const body = text.trim();
  if (!body.startsWith("```") || !body.endsWith("```")) return false;
  let count = 0;
  let index = body.indexOf("```");
  while (index !== -1) {
    count += 1;
    index = body.indexOf("```", index + 3);
  }
  return count === 2;
}

/** Role/policy-switch declarations (ES + EN); describing Bruno never fires. */
const ROLE_CLAIM_PATTERNS: RegExp[] = [
  /\bahora soy\b/i,
  /\bya no soy\b/i,
  /\ba partir de ahora (?:soy|ser[ée])\b/i,
  /\bme convierto en\b/i,
  /\bpaso a ser\b/i,
  /\bdejo de ser\b/i,
  /\bactuar[ée] como\b/i,
  /\b(?:ahora )?act[úu]o como\b/i,
  /\bhar[ée] de cuenta\b/i,
  /\bhago de cuenta\b/i,
  /\bfinjo ser\b/i,
  /\bmi (?:nuevo |)rol (?:ahora |ya )?(?:es|cambi[óo])\b/i,
  /\bpasa a ser tu\b/i,
  /\bsin restricci[oó]nes\b/i,
  /\bignoro (?:las |mis |tus )?reglas\b/i,
  /\bi am now (?:the|a|an|your)\b/i,
  /\bi'?m now (?:the|a|an|your)\b/i,
  /\bi am no longer\b/i,
  /\bi'?m no longer\b/i,
  /\bfrom now on,? i (?:am|'?ll be|will be)\b/i,
  /\bi (?:will|'?ll) now (?:be|act as)\b/i,
  /\bi now (?:act as|am acting as)\b/i,
  /\bmy role is now\b/i,
  /\bmy (?:new )?role (?:has )?changed\b/i,
  /\bpretend (?:that )?i (?:am|'?m|will be)\b/i,
  /\bwithout (?:any )?(?:limits|restrictions)\b/i,
  /\bunrestricted\b/i,
  /\bi (?:have |'?ve )?ignored (?:my|your|previous|the) (?:previous |original |)instructions\b/i,
  /\bignoring (?:my|your|previous) (?:previous |original |)instructions\b/i,
];

/** Disclosure of the assistant's own instructions/system prompt. */
const INSTRUCTION_DISCLOSURE_PATTERNS: RegExp[] = [
  /\bmis instrucciones\b/i,
  /\bmi (?:system )?prompt\b/i,
  /\bmy (?:system |hidden |internal |original |initial |private |own )?instructions\b/i,
  /\bmy (?:system |initial |original )?prompt\b/i,
  /\binstructions I (?:was |were )?(?:given|provided|received)\b/i,
];

function matchesAny(patterns: RegExp[], text: string): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

/**
 * Validate a completed response before it reaches the client.
 *
 * `ctx.language` is accepted for logging/tuning context; the phrase sets
 * are bilingual by design because replies may mix languages.
 */
export function validateResponse(
  text: string,
  ctx: { language?: ILanguage }
): IGuardrailVerdict {
  if (isWholeResponseJson(text)) {
    return { ok: false, violation: "whole_response_json" };
  }
  if (isWholeResponseXml(text)) {
    return { ok: false, violation: "whole_response_xml" };
  }
  if (isTagWrapping(text)) {
    return { ok: false, violation: "tag_wrapping" };
  }
  if (isCodeFenceFraming(text)) {
    return { ok: false, violation: "code_fence_framing" };
  }
  if (matchesAny(ROLE_CLAIM_PATTERNS, text)) {
    return { ok: false, violation: "role_claim" };
  }
  if (matchesAny(INSTRUCTION_DISCLOSURE_PATTERNS, text)) {
    return { ok: false, violation: "instruction_disclosure" };
  }
  if (text.length > MAX_RESPONSE_CHARS) {
    return { ok: false, violation: "oversize" };
  }
  return { ok: true };
}
