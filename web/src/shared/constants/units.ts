// Built-in unit suggestions shown in the UI — the field itself is a free
// string on Product, not a closed enum, so custom units can be typed in
// too (this business deals in everything from single pieces to metres of
// ribbon and grams of resin).
export const DEFAULT_UNITS = [
  "PCS",
  "Set",
  "Pair",
  "Box",
  "Pack",
  "Dozen",
  "Meter",
  "Roll",
  "Sheet",
  "Gram",
  "Kilogram",
  "Millilitre",
  "Litre",
] as const;

export const DEFAULT_UNIT = "PCS";
