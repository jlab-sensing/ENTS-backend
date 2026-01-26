import 'chartjs-adapter-luxon';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import { React } from 'react';
import { getAxisBoundsAndStepValues } from './alignAxis';
import ChartWrapper from './ChartWrapper';
import { chartPlugins } from './plugins';

export default function UniversalChart({ data, stream, chartId, measurements, units, axisIds, onResampleChange }) {
  // Build chart options dynamically based on measurements
  const buildChartOptions = () => {
    const scales = {
      x: {
        position: 'bottom',
        title: {
          display: true,
          text: 'Time',
        },
        type: 'time',
        ticks: {
          autoSkip: stream ? true : false,
          autoSkipPadding: 50,
          maxRotation: 0,
          major: {
            enabled: true,
          },
          ...(stream && { padding: 15 }),
        },
        ...(stream && {
          grid: {
            tickLength: 15,
          },
        }),
        time: {
          displayFormats: stream
            ? {
                second: 'hh:mm:ss',
                minute: 'hh:mm',
                hour: 'hh:mm a',
                day: 'D',
              }
            : {
                hour: 'hh:mm a',
                day: 'MM/dd',
              },
        },
        ...(stream && {
          suggestedMin: DateTime.now().minus({ second: 10 }).toJSON(),
          suggestedMax: DateTime.now().toJSON(),
        }),
      },
    };

    // Handle single measurement (left axis only)
    if (measurements.length === 1) {
      const { leftYMin, leftYMax, leftYStep } = getAxisBoundsAndStepValues(data.datasets, [], 6, 0);

      scales.y = {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: `${measurements[0].charAt(0).toUpperCase() + measurements[0].slice(1)} (${units[0]})`,
        },
        ...(stream
          ? { grace: '10%' }
          : {
              ticks: {
                stepSize: leftYStep,
                callback: function(value) {
                  // Display whole numbers where possible
                  return Number.isInteger(value) ? value : value.toFixed(1);
                },
              },
              min: leftYMin,
              max: leftYMax,
            }),
      };
    }
    // Handle dual measurements (left and right axes)
    else if (measurements.length === 2) {
      const leftDatasets = data.datasets.filter((d) => d.yAxisID === axisIds[0]);
      const rightDatasets = data.datasets.filter((d) => d.yAxisID === axisIds[1]);

      const { leftYMin, leftYMax, leftYStep, rightYMin, rightYMax, rightYStep } = getAxisBoundsAndStepValues(
        leftDatasets,
        rightDatasets,
        6,
        0,
      );

      scales[axisIds[0]] = {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: `${measurements[0].charAt(0).toUpperCase() + measurements[0].slice(1)} (${units[0]})`,
        },
        ...(stream
          ? { grace: '10%' }
          : {
              ticks: {
                stepSize: leftYStep,
                callback: function(value) {
                  return Number.isInteger(value) ? value : value.toFixed(1);
                },
              },
              min: leftYMin,
              max: leftYMax,
            }),
      };

      scales[axisIds[1]] = {
        type: 'linear',
        position: 'right',
        title: {
          display: true,
          text: `${measurements[1].charAt(0).toUpperCase() + measurements[1].slice(1)} (${units[1]})`,
        },
        grid: {
          drawOnChartArea: false, // Don't draw grid lines for right axis to avoid clutter
        },
        ...(stream
          ? { grace: '10%' }
          : {
              ticks: {
                stepSize: rightYStep,
                callback: function(value) {
                  return Number.isInteger(value) ? value : value.toFixed(1);
                },
              },
              min: rightYMin,
              max: rightYMax,
            }),
      };
    }

    return {
      maintainAspectRatio: false,
      responsive: true,
      parsing: false,
      scales,
      ...(measurements.length > 1 && { plugins: structuredClone(chartPlugins) }),
    };
  };

  const chartOptions = buildChartOptions();

  return (
    <ChartWrapper id={chartId} data={data} options={chartOptions} stream={stream} onResampleChange={onResampleChange} />
  );
}

UniversalChart.propTypes = {
  data: PropTypes.object.isRequired,
  stream: PropTypes.bool,
  chartId: PropTypes.string.isRequired,
  measurements: PropTypes.arrayOf(PropTypes.string).isRequired,
  units: PropTypes.arrayOf(PropTypes.string).isRequired,
  axisIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  startDate: PropTypes.object,
  endDate: PropTypes.object,
  onResampleChange: PropTypes.func,
};
