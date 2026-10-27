const BLUR_FADE_DELAY = 0.04;

/** DOM id of the "Explore My Story" heading above the AI assistant. */
const ASSISTANT_HEADING_ID = "assistant-heading";

/** DOM id of the assistant's message input, focused by the hero CTA. */
const ASSISTANT_INPUT_ID = "assistant-input";

/**
 * Matches Tailwind's `md` boundary (768px). Below it the assistant is a
 * fullscreen page rather than the inline card, so the hero CTA and the
 * launcher must agree on exactly the same cut-off.
 */
const NARROW_VIEWPORT_QUERY = "(max-width: 767px)";

export default {
  BLUR_FADE_DELAY,
  ASSISTANT_HEADING_ID,
  ASSISTANT_INPUT_ID,
  NARROW_VIEWPORT_QUERY,
};
