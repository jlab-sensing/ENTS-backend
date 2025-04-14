import 'chartjs-adapter-luxon';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import { React } from 'react';
import { getMaxAxisAndStepValues } from '../alignAxis';
import ChartWrapper from '../ChartWrapper';

export default function PwrChart({ data, stream, startDate, endDate }) {
  const { leftYMax, leftYStep } = getMaxAxisAndStepValues(data.datasets, [], 10, 5);
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
        min: stream ? undefined : startDate?.toJSDate(),
        max: stream ? undefined : endDate?.toJSDate(),
      },
      y: {
        type: 'linear',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Power (µW)',
        },
        ticks: {
          beginAtZero: true,
          stepSize: leftYStep,
        },
        min: 0,
        max: leftYMax,
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
          autoSkip: true,
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
      y: {
        type: 'linear',
        beginAtZero: true,
        grace: '10%',
        title: {
          display: true,
          text: 'Power (µW)',
        },
      },
    },
  };

  return <ChartWrapper id='pwr' data={data} options={stream ? streamChartOptions : chartOptions} stream={stream} />;
}

PwrChart.propTypes = {
  data: PropTypes.object,
  stream: PropTypes.bool,
  startDate: PropTypes.object,
  endDate: PropTypes.object,
};
