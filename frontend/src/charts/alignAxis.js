// Date: 04/22/24
// Author: Aaron Wu
// aligns axis based on the maximum values of the chart axis
// takes arrays of datasets of the left axis and the right axis and
// scales them to have their grid lines match

/*** calculates new y axis max based on tick counts and the step factor
 * @param  {[number]} tickCount maximum number of ticks both axis should share
 * @param  {[number]} max largest datapoint in dataset
 * @param  {[number]} factor number that each step between ticks should be a factor of
 * @return {[number]}      the new y axis maximum for the chart to fit the requirements of tick count and factor
 */
//
function calculateMax(tickCount, max, factor) {
  // If max is divisible by amount of labels, then it's a perfect fit
  if (max % tickCount === 0) {
    return max;
  }
  // If max is not divisible by amount of labels, let's find out how much there
  // is missing from max so it could be divisible
  const diffDivisibleByAmountOfLabels = factor * tickCount - (max % (factor * tickCount));

  // Add missing value to max to get it divisible and achieve perfect fit
  // Also finds the next multiple to get even & readable spacing, based on label count
  return Math.ceil((max + diffDivisibleByAmountOfLabels) / (factor * tickCount)) * (factor * tickCount);
}

/*** Gets the min and max values to align chart axis
 * @param  {[array]} datasetsLeft array of datasets for the left y axis
 * @param  {[array]} datasetsRight array of datasets for the right y axis
 * @param  {[number]} tickCount maximum number of ticks both axis should share
 * @param  {[number]} factor number that each step between ticks should be a factor of
 * @return {[Object]}      leftYMax, rightYMax, leftYstep, rightYstep
 */
export function getMaxAxisAndStepValues(datasetsLeft, datasetsRight, tickCount, factor) {
  // if dataset is empty or not initialized
  let leftYMax = 10;
  let leftYStep = 2;
  let rightYMax = 10;
  let rightYStep = 2;
  if (datasetsLeft !== undefined && datasetsLeft.length !== 0) {
    if (datasetsLeft[0].data[0] != undefined) {
      console.log(datasetsLeft[0].data[0], datasetsLeft.length !== 0);
      leftYMax = datasetsLeft[0].data[0].y;
    }
    datasetsLeft.forEach((datasetLeft) => {
      if (datasetLeft !== undefined && datasetLeft.length !== 0 && datasetLeft.data.length !== 0) {
        // Find max values from data
        leftYMax = Math.max(leftYMax, Math.max(...datasetLeft.data.map((dataPoint) => dataPoint.y)));
        leftYMax = calculateMax(tickCount, leftYMax, factor);
        leftYStep = leftYMax / tickCount;
      }
    });
  }

  if (datasetsRight !== undefined && datasetsRight.length != 0) {
    if (datasetsRight[0].data[0] != undefined) {
      console.log(datasetsRight[0].data[0], datasetsRight.length !== 0);
      rightYMax = datasetsRight[0].data[0].y;
    }
    datasetsRight.forEach((datasetRight) => {
      if (datasetRight !== undefined && datasetRight.length !== 0 && datasetRight.data.length !== 0) {
        // Find max values from data
        rightYMax = Math.max(rightYMax, Math.max(...datasetRight.data.map((dataPoint) => dataPoint.y)));
        rightYMax = calculateMax(tickCount, rightYMax, factor);
        rightYStep = rightYMax / tickCount;
      }
    });
  }

  // steps should be positive
  leftYStep = Math.abs(leftYStep);
  rightYStep = Math.abs(rightYStep);
  console.log('axis', leftYMax, leftYStep);
  return { leftYMax, rightYMax, leftYStep, rightYStep };
}
