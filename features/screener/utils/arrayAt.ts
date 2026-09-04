// A tiny bounds-checked accessor for indices we already know are in range
// (e.g. from findSwingLowIndices on the very same array) — keeps
// noUncheckedIndexedAccess happy without sprinkling non-null assertions.
export function at(values: number[], index: number): number {
  const value = values[index];
  if (value === undefined) {
    throw new RangeError(`Index ${index} is out of bounds`);
  }
  return value;
}
