/** Gets the min and max values to align chart axis */
export function getMaxAxisAndStepValues(datasetLeft, datasetRight, tickCount, factor) {
  // if dataset is empty or not initialized
  console.log('d', datasetLeft, datasetRight);
  let leftYMax = 10;
  let leftYStep = 2;
  let rightYMax = 10;
  let rightYStep = 2;
  if (datasetLeft === undefined || datasetLeft == null || datasetLeft.data.length == 0) {
    leftYMax = 10;
    leftYStep = 2;
  } else {
    // Find max values from data
    leftYMax = Math.max(...datasetLeft.data.map((dataPoint) => dataPoint.y));
    leftYMax = calculateMax(tickCount, leftYMax, factor);
    leftYStep = leftYMax / tickCount;
  }
  if (datasetRight === undefined || datasetLeft == null || datasetRight.data.length == 0) {
  } else {
    // Find max values from data
    rightYMax = Math.max(...datasetRight.data.map((dataPoint) => dataPoint.y));
    rightYMax = calculateMax(tickCount, rightYMax, factor);
    rightYStep = rightYMax / tickCount;
  }
  // Find max values from data
  //   const leftYMax = Math.max(...datasetLeft.data.map((dataPoint) => dataPoint.y));
  //   const rightYMax = Math.max(...datasetRight.data.map((dataPoint) => dataPoint.y));

  //   newLeftYMax = calculateMax(tickCount, leftYMax, factor);
  //   const leftYStep = newLeftYMax / tickCount;

  //   newRightYMax = calculateMax(tickCount, rightYMax, factor);
  //   const rightYStep = newRightYMax / tickCount;

  //   console.log('res', { leftYMax: newLeftYMax, rightYMax: newRightYMax, leftYStep, rightYStep });

  return { leftYMax, rightYMax, leftYStep, rightYStep };
}

// Function for calculating new max
function calculateMax(tickCount, max, factor) {
  // If max is divisible by amount of labels, then it's a perfect fit
  if (max % tickCount === 0) {
    return max;
  }
  // If max is not divisible by amount of labels, let's find out how much there
  // is missing from max so it could be divisible
  const diffDivisibleByAmountOfLabels = tickCount - (max % tickCount);

  // Add missing value to max to get it divisible and achieve perfect fit
  // Also finds the next multiple to get even & readable spacing, based on label count
  console.log('should beb 100', factor * tickCount, factor, tickCount);
  return Math.ceil((max + diffDivisibleByAmountOfLabels) / (factor * tickCount)) * (factor * tickCount);
}
