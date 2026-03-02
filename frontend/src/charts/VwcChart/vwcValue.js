export function toPercentIfFraction(value) {
  if (!Number.isFinite(value)) return null;
  return value > 0 && value <= 1 ? value * 100 : value;
}
