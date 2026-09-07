import { at } from "./arrayAt";

// Aggregates consecutive bars into coarser ones (e.g. four 1H bars into one
// 4H bar) by keeping the last close/date of each group — there's no native
// 4H interval on most data providers, so this derives it from 1H bars.
export function resampleCloses(
  closes: number[],
  dates: string[],
  groupSize: number,
): { closes: number[]; dates: string[] } {
  const resampledCloses: number[] = [];
  const resampledDates: string[] = [];
  for (let i = 0; i < closes.length; i += groupSize) {
    const closeGroup = closes.slice(i, i + groupSize);
    const dateGroup = dates.slice(i, i + groupSize);
    resampledCloses.push(at(closeGroup, closeGroup.length - 1));
    resampledDates.push(at(dateGroup, dateGroup.length - 1));
  }
  return { closes: resampledCloses, dates: resampledDates };
}
