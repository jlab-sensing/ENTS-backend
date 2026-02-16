import 'chartjs-adapter-luxon';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import { React } from 'react';
import { getAxisBoundsAndStepValues } from '../alignAxis';
import { getNonStreamTimeDomain } from '../timeDomain';
import ChartWrapper from '../ChartWrapper';
import { getVwcAxisBounds } from './vwcAxis';

export default function VwcChart({ data, stream, startDate, endDate, onResampleChange }) {
  const vwcDatasets = data.datasets.filter((_, i) => i % 2 == 0);
  const { leftYMin, leftYMax, leftYStep, rightYMin, rightYMax, rightYStep } = getAxisBoundsAndStepValues(
    vwcDatasets,
    data.datasets.filter((_, i) => i % 2 == 1),
    10,
    10,
  );
  const { min: vwcMin, max: vwcMax, step: vwcStep } = getVwcAxisBounds(vwcDatasets);
  const nonStreamXDomain = getNonStreamTimeDomain(stream, startDate, endDate);

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    parsing: false,
    scales: {
      x: {
        position: 'bottom',
        title: {
          display: true,
          text: 'Time',
        },
        type: 'time',
        ticks: {
          autoSkip: false,
          autoSkipPadding: 50,
          maxRotation: 0,
          major: {
            enabled: true,
          },
        },
        time: {
          displayFormats: {
            hour: 'hh:mm a',
            day: 'MM/dd',
          },
        },
        ...nonStreamXDomain,
      },
      ecAxis: {
        type: 'linear',
        position: 'right',
        title: {
          display: true,
          text: 'EC (µS/cm)',
        },
        ticks: {
          stepSize: rightYStep,
        },
        min: rightYMin,
        max: rightYMax,
      },
      vwcAxis: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'VWC (%)',
        },
        ticks: {
          stepSize: vwcStep,
        },
        min: vwcMin,
        max: vwcMax,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const streamChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        position: 'bottom',
        title: {
          display: true,
          text: 'Time',
        },
        type: 'time',
        ticks: {
          autoSkip: false,
          autoSkipPadding: 50,
          maxRotation: 0,
          major: {
            enabled: true,
          },
          padding: 15,
        },
        grid: {
          tickLength: 15,
        },
        time: {
          displayFormats: {
            second: 'hh:mm:ss',
            minute: 'hh:mm',
            hour: 'hh:mm a',
            day: 'D',
          },
        },
        suggestedMin: DateTime.now().minus({ second: 10 }).toJSON(),
        suggestedMax: DateTime.now().toJSON(),
      },
      ecAxis: {
        type: 'linear',
        grace: '10%',
        position: 'right',
        title: {
          display: true,
          text: 'EC (µS/cm)',
        },
      },
      vwcAxis: {
        type: 'linear',
        grace: '10%',
        position: 'left',
        title: {
          display: true,
          text: 'VWC (%)',
        },
        ticks: {
          stepSize: vwcStep,
        },
        min: vwcMin,
        max: vwcMax,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <ChartWrapper
      id='vwc'
      data={data}
      options={stream ? streamChartOptions : chartOptions}
      stream={stream}
      onResampleChange={onResampleChange}
    />
  );
}

VwcChart.propTypes = {
  data: PropTypes.object,
  stream: PropTypes.bool,
  startDate: PropTypes.object,
  endDate: PropTypes.object,
  onResampleChange: PropTypes.func,
};
