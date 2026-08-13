/**
 * Single source of truth for product identity.
 * Renaming the product is a one-line change here — every surface reads BRAND.
 */
export const BRAND = {
  name: "Sentinel",
  // Used in the wordmark glyph (the round logo tile).
  glyph: "◈",
  tagline: "The operating system for AI-native companies.",
  // One-liner for hero / meta descriptions.
  description:
    "Hire autonomous AI workers, allocate budgets, govern their spending, and let trust decide who earns more autonomy. The financial control plane for an AI-native workforce.",
} as const;
