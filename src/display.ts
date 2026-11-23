export function formatNumber(value: number): string {
  return Number(value.toPrecision(7)).toString();
}

export function formatCoordinates(values: readonly number[]): string {
  const coordinates = values.map(formatNumber).join(', ');
  return values.length === 1 ? coordinates : `(${coordinates})`;
}
