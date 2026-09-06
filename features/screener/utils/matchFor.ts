import type { CriteriaMatch, ScreenerCriteria, ScreenerResult } from "../types";

export function matchFor(
  result: ScreenerResult,
  criteria: ScreenerCriteria,
): CriteriaMatch | undefined {
  return result.matches.find((m) => m.criteria === criteria);
}
