import type { ConfidenceLevel, CriteriaMatch } from "../types";
import { at } from "./arrayAt";

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

// Bullish divergence is checked on multiple timeframes; a ticker qualifies
// if any of them shows the setup, at the strongest confidence found across
// them, with each timeframe's own detail lines kept for manual review.
export function mergeBullishDivergenceMatches(
  matches: Array<CriteriaMatch | null>,
): CriteriaMatch | null {
  const found = matches.filter(
    (match): match is CriteriaMatch => match !== null,
  );
  if (found.length === 0) {
    return null;
  }

  const confidence = found.reduce<ConfidenceLevel>(
    (best, match) =>
      CONFIDENCE_RANK[match.confidence] > CONFIDENCE_RANK[best]
        ? match.confidence
        : best,
    at(found, 0).confidence,
  );

  return {
    criteria: "bullish_divergence",
    confidence,
    detail: found.flatMap((match) => match.detail),
  };
}
