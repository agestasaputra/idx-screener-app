import type {
  ConfidenceLevel,
  ScreenerCriteria,
  ScreenerResult,
} from "../types";

export interface ActiveFilters {
  query: string;
  minClose: number | null;
  maxClose: number | null;
  criteria: ScreenerCriteria[];
  confidence: ConfidenceLevel[];
  sectors: string[];
}

function matchesSearch(result: ScreenerResult, query: string): boolean {
  if (!query) return true;
  return (
    result.symbol.toLowerCase().includes(query) ||
    result.name.toLowerCase().includes(query)
  );
}

function matchesCloseRange(
  result: ScreenerResult,
  minClose: number | null,
  maxClose: number | null,
): boolean {
  if (minClose !== null && result.lastClose < minClose) return false;
  if (maxClose !== null && result.lastClose > maxClose) return false;
  return true;
}

function matchesCriteria(
  result: ScreenerResult,
  criteria: ScreenerCriteria[],
): boolean {
  if (criteria.length === 0) return true;
  return result.matches.some((m) => criteria.includes(m.criteria));
}

function matchesConfidence(
  result: ScreenerResult,
  confidence: ConfidenceLevel[],
): boolean {
  if (confidence.length === 0) return true;
  return result.matches.some((m) => confidence.includes(m.confidence));
}

function matchesSector(result: ScreenerResult, sectors: string[]): boolean {
  if (sectors.length === 0) return true;
  return result.sector !== null && sectors.includes(result.sector);
}

export function matchesFilters(
  result: ScreenerResult,
  filters: ActiveFilters,
): boolean {
  return (
    matchesSearch(result, filters.query) &&
    matchesCloseRange(result, filters.minClose, filters.maxClose) &&
    matchesCriteria(result, filters.criteria) &&
    matchesConfidence(result, filters.confidence) &&
    matchesSector(result, filters.sectors)
  );
}
