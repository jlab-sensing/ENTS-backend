// Date: 04/22/24
// Author: Aaron Wu
// Updated: [Current Date] - Fixed negative dataset handling
// aligns axis based on the min/max values of the chart axis
// takes arrays of datasets of the left axis and the right axis and
// scales them to have their grid lines match

/*** Calculates a "nice" step value that results in whole numbers on the axis
 * @param  {[number]} range the data range
 * @param  {[number]} tickCount desired number of ticks
 * @return {[number]} a nice step value (1, 2, 5, 10, 20, 50, etc.)
 */
function getNiceStep(range, tickCount) {
  const rawStep = range / tickCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;

  let niceStep;
  if (normalized <= 1) {
    niceStep = 1;
  } else if (normalized <= 2) {
    niceStep = 2;
  } else if (normalized <= 5) {
    niceStep = 5;
  } else {
    niceStep = 10;
  }

  return niceStep * magnitude;
}

/*** calculates new y axis bounds based on tick counts and the step factor
 * @param  {[number]} tickCount maximum number of ticks both axis should share
 * @param  {[number]} min smallest datapoint in dataset
 * @param  {[number]} max largest datapoint in dataset
 * @param  {[number]} factor number that each step between ticks should be a factor of (ignored if 0, uses nice numbers instead)
 * @return {[Object]}      object with min, max, and step values for the axis
 */
function calculateAxisBounds(tickCount, min, max, factor) {
  // Handle edge cases
  if (min === max) {
    if (min === 0) {
      return { min: 0, max: 10, step: 2 };
    } else if (min > 0) {
      const niceMax = Math.ceil(min * 1.2);
      const step = getNiceStep(niceMax, tickCount);
      return { min: 0, max: Math.ceil(niceMax / step) * step, step };
    } else {
      const niceMin = Math.floor(min * 1.2);
      const step = getNiceStep(Math.abs(niceMin), tickCount);
      return { min: Math.floor(niceMin / step) * step, max: 0, step };
    }
  }

  // Calculate range
  const range = max - min;
  const padding = range * 0.1; // 10% padding

  let axisMin, axisMax;

  // Determine axis bounds based on data distribution
  if (min >= 0) {
    // All positive data - start from 0
    axisMin = 0;
    axisMax = max + padding;
  } else if (max <= 0) {
    // All negative data - end at 0 or slightly above
    axisMin = min - padding;
    axisMax = Math.max(0, max * 0.1);
  } else {
    // Mixed positive/negative data
    axisMin = min - padding;
    axisMax = max + padding;
  }

  // Calculate step size using nice numbers
  const axisRange = axisMax - axisMin;
  let step = getNiceStep(axisRange, tickCount);

  // Round bounds to align with step for cleaner numbers
  if (min >= 0) {
    axisMin = 0;
    axisMax = Math.ceil(axisMax / step) * step;
  } else if (max <= 0) {
    axisMax = 0;
    axisMin = Math.floor(axisMin / step) * step;
  } else {
    // Mixed data - align both bounds
    axisMin = Math.floor(axisMin / step) * step;
    axisMax = Math.ceil(axisMax / step) * step;
  }

  return {
    min: axisMin,
    max: axisMax,
    step: step,
  };
}

/*** Gets the min, max, and step values to align chart axis
 * @param  {[array]} datasetsLeft array of datasets for the left y axis
 * @param  {[array]} datasetsRight array of datasets for the right y axis
 * @param  {[number]} tickCount maximum number of ticks both axis should share
 * @param  {[number]} factor number that each step between ticks should be a factor of
 * @return {[Object]}      leftYMin, leftYMax, leftYStep, rightYMin, rightYMax, rightYStep
 */
export function getAxisBoundsAndStepValues(datasetsLeft, datasetsRight, tickCount, factor) {
  // Default values for empty datasets
  let leftYMin = 0,
    leftYMax = 10,
    leftYStep = 2;
  let rightYMin = 0,
    rightYMax = 10,
    rightYStep = 2;

  // Process left axis datasets
  if (datasetsLeft && datasetsLeft.length > 0) {
    let allLeftValues = [];

    datasetsLeft.forEach((dataset) => {
      if (dataset && dataset.data && dataset.data.length > 0) {
        const values = dataset.data.map((dataPoint) => dataPoint.y).filter((y) => y !== null && y !== undefined);
        allLeftValues = allLeftValues.concat(values);
      }
    });

    if (allLeftValues.length > 0) {
      const min = Math.min(...allLeftValues);
      const max = Math.max(...allLeftValues);
      const bounds = calculateAxisBounds(tickCount, min, max, factor);
      leftYMin = bounds.min;
      leftYMax = bounds.max;
      leftYStep = bounds.step;
    }
  }

  // Process right axis datasets
  if (datasetsRight && datasetsRight.length > 0) {
    let allRightValues = [];

    datasetsRight.forEach((dataset) => {
      if (dataset && dataset.data && dataset.data.length > 0) {
        const values = dataset.data.map((dataPoint) => dataPoint.y).filter((y) => y !== null && y !== undefined);
        allRightValues = allRightValues.concat(values);
      }
    });

    if (allRightValues.length > 0) {
      const min = Math.min(...allRightValues);
      const max = Math.max(...allRightValues);
      const bounds = calculateAxisBounds(tickCount, min, max, factor);
      rightYMin = bounds.min;
      rightYMax = bounds.max;
      rightYStep = bounds.step;
    }
  }

  return { leftYMin, leftYMax, leftYStep, rightYMin, rightYMax, rightYStep };
}

// Backward compatibility - keep old function name but mark as deprecated
export function getMaxAxisAndStepValues(datasetsLeft, datasetsRight, tickCount, factor) {
  console.warn('getMaxAxisAndStepValues is deprecated. Use getAxisBoundsAndStepValues instead.');
  const bounds = getAxisBoundsAndStepValues(datasetsLeft, datasetsRight, tickCount, factor);
  return {
    leftYMax: bounds.leftYMax,
    rightYMax: bounds.rightYMax,
    leftYStep: bounds.leftYStep,
    rightYStep: bounds.rightYStep,
  };
}
