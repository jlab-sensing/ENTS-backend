import { React } from 'react';
import 'chartjs-adapter-luxon';
import PropTypes from 'prop-types';
import ChartWrapper from '../ChartWrapper';
import { chartPlugins } from '../plugins';

export default function PwrChart({ data }) {
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
    plugins: structuredClone(chartPlugins),
  };

  return <ChartWrapper id='pwr' data={data} options={chartOptions} />;
}

PwrChart.propTypes = {
  data: PropTypes.object,
};
