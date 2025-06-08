// Date: 04/22/24
// Author: Aaron Wu
// Updated: [Current Date] - Fixed negative dataset handling
// aligns axis based on the min/max values of the chart axis
// takes arrays of datasets of the left axis and the right axis and
// scales them to have their grid lines match

/*** calculates new y axis bounds based on tick counts and the step factor
 * @param  {[number]} tickCount maximum number of ticks both axis should share
 * @param  {[number]} min smallest datapoint in dataset
 * @param  {[number]} max largest datapoint in dataset
 * @param  {[number]} factor number that each step between ticks should be a factor of
 * @return {[Object]}      object with min, max, and step values for the axis
 */
function calculateAxisBounds(tickCount, min, max, factor) {
  // Handle edge cases
  if (min === max) {
    if (min === 0) {
      return { min: 0, max: 10, step: 10 / tickCount };
    } else if (min > 0) {
      return { min: 0, max: min * 1.1, step: (min * 1.1) / tickCount };
    } else {
      return { min: min * 1.1, max: 0, step: Math.abs(min * 1.1) / tickCount };
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

  // Calculate step size
  const axisRange = axisMax - axisMin;
  let step = axisRange / tickCount;

  // Round step to nice numbers based on factor
  if (factor > 0) {
    step = Math.ceil(step / factor) * factor;

    // Recalculate bounds to align with step
    const totalSteps = Math.ceil(axisRange / step);
    const totalRange = totalSteps * step;
    const extraRange = totalRange - axisRange;

    if (min >= 0) {
      axisMax = axisMin + totalRange;
    } else if (max <= 0) {
      axisMin = axisMax - totalRange;
    } else {
      // For mixed data, distribute extra range proportionally
      const minRatio = Math.abs(axisMin) / axisRange;
      axisMin -= extraRange * minRatio;
      axisMax += extraRange * (1 - minRatio);
    }
  }

  return {
    min: axisMin,
    max: axisMax,
    step: Math.abs(step),
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
