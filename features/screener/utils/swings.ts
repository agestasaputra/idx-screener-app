export function findSwingLowIndices(
  values: number[],
  lookback: number,
): number[] {
  const indices: number[] = [];
  for (let i = lookback; i < values.length - lookback; i += 1) {
    const window = values.slice(i - lookback, i + lookback + 1);
    if (Math.min(...window) === values[i]) {
      indices.push(i);
    }
  }
  return indices;
}

export function findSwingHighIndices(
  values: number[],
  lookback: number,
): number[] {
  const indices: number[] = [];
  for (let i = lookback; i < values.length - lookback; i += 1) {
    const window = values.slice(i - lookback, i + lookback + 1);
    if (Math.max(...window) === values[i]) {
      indices.push(i);
    }
  }
  return indices;
}
