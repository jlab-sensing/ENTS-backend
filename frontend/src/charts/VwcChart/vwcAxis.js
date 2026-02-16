export function getVwcAxisBounds(vwcDatasets, tickCount = 10) {
  const HEADROOM_RATIO = 0.03;
  const MIN_HEADROOM = 1;

  const vwcValues = vwcDatasets
    .flatMap((dataset) => (Array.isArray(dataset.data) ? dataset.data : []))
    .map((point) => point?.y)
    .filter((value) => Number.isFinite(value));

  const observedMax = vwcValues.length > 0 ? Math.max(...vwcValues) : 0;
  const max = observedMax > 50
    ? Math.ceil(observedMax + Math.max(MIN_HEADROOM, observedMax * HEADROOM_RATIO))
    : 50;
  const min = 0;
  const step = Math.max(1, Math.ceil((max - min) / tickCount));

  return { min, max, step };
}
