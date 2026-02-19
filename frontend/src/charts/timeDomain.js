export function getNonStreamTimeDomain(stream, startDate, endDate) {
  if (stream) {
    return {};
  }

  if (
    !startDate ||
    !endDate ||
    typeof startDate.toMillis !== 'function' ||
    typeof endDate.toMillis !== 'function'
  ) {
    return {};
  }

  if (typeof startDate.isValid === 'boolean' && !startDate.isValid) {
    return {};
  }
  if (typeof endDate.isValid === 'boolean' && !endDate.isValid) {
    return {};
  }

  const startMillis = startDate.toMillis();
  const endMillis = endDate.toMillis();

  if (!Number.isFinite(startMillis) || !Number.isFinite(endMillis)) {
    return {};
  }

  return startMillis <= endMillis
    ? { min: startMillis, max: endMillis }
    : { min: endMillis, max: startMillis };
}
