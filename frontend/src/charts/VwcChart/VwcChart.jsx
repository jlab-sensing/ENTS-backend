import { React } from 'react';
import 'chartjs-adapter-luxon';
import PropTypes from 'prop-types';
import ChartWrapper from '../ChartWrapper';
import { DateTime } from 'luxon';
import { getMaxAxisAndStepValues } from '../alignAxis';

export default function VwcChart({ data, stream }) {
  const { leftYMax, rightYMax, leftYStep, rightYStep } = getMaxAxisAndStepValues(
    data.datasets.filter((_, i) => i % 2 == 0),
    data.datasets.filter((_, i) => i % 2 == 1),
    10,
    10,
  );
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
      },
      ecAxis: {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        suggestedMax: 650,
        title: {
          display: true,
          text: 'EC (µS/cm)',
        },
        ticks: {
          beginAtZero: true,
          stepSize: rightYStep,
        },
        min: 0,
        max: rightYMax,
      },
      vwcAxis: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        suggestedMax: 0.65,
        title: {
          display: true,
          text: 'VWC (%)',
        },
        ticks: {
          beginAtZero: true,
          stepSize: leftYStep,
        },
        min: 0,
        max: leftYMax,
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
        beginAtZero: true,
        suggestedMax: 650,
        title: {
          display: true,
          text: 'EC (µS/cm)',
        },
      },
      vwcAxis: {
        type: 'linear',
        grace: '10%',
        position: 'left',
        beginAtZero: true,
        suggestedMax: 0.65,
        title: {
          display: true,
          text: 'VWC (%)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return <ChartWrapper id='vwc' data={data} options={stream ? streamChartOptions : chartOptions} stream={stream} />;
}

VwcChart.propTypes = {
  data: PropTypes.object,
  stream: PropTypes.bool,
};
