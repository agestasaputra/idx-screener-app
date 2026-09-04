import type { ConfidenceLevel, CriterionMatch } from "../types";

export type ConvictionLevel = "high" | "medium" | "low";

// Rewards corroboration across criteria over a single strong signal — one
// high-confidence match alone reads as "medium", not "high".
const CONFIDENCE_WEIGHT: Record<ConfidenceLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function computeConviction(matches: CriterionMatch[]): ConvictionLevel {
  const score = matches.reduce(
    (sum, m) => sum + CONFIDENCE_WEIGHT[m.confidence],
    0,
  );
  if (score >= 6) return "high";
  if (score >= 3) return "medium";
  return "low";
}
