import { React, useEffect } from 'react';
import 'chartjs-adapter-luxon';
import PropTypes from 'prop-types';
import ChartWrapper from '../ChartWrapper';
import { DateTime } from 'luxon';

export default function PwrChart({ data, stream }) {
  const chartOptions = {
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
        },
        time: {
          displayFormats: {
            day: 'D',
          },
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Power (µW)',
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
        },
        time: {
          displayFormats: {
            hour: 'hh:mm a',
            day: 'D',
          },
        },
        suggestedMin: DateTime.now().minus({ second: 10 }).toJSON(),
        suggestedMax: DateTime.now().toJSON(),
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Power (µW)',
        },
      },
    },
  };
  useEffect(() => {
    console.log('changed', data);
  });

  return <ChartWrapper id='pwr' data={data} options={stream ? streamChartOptions : chartOptions} stream={stream} />;
}

PwrChart.propTypes = {
  data: PropTypes.object,
};
