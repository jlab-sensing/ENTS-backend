import { React } from 'react';
import 'chartjs-adapter-luxon';
import PropTypes from 'prop-types';
import ChartWrapper from '../ChartWrapper';
import { chartPlugins } from '../plugins';
import { getMaxAxisAndStepValues } from '../alignAxis';

export default function PresHumChart({ data }) {
  const { leftYMax, leftYStep } = getMaxAxisAndStepValues(data.datasets, [], 8, 0.2);
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
            hour: 'hh:mm a',
            day: 'D',
          },
        },
      },
      pressure: {
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Pressure (hPa)',
        },
        ticks: {
          beginAtZero: true,
          stepSize: leftYStep,
        },
        min: 0,
        max: leftYMax,
      },
      humidity: {
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Humidity (% RH)',
        },
        ticks: {
          beginAtZero: true,
          stepSize: leftYStep,
        },
        min: 0,
        max: leftYMax,
      },
    },
    plugins: structuredClone(chartPlugins),
  };

  return <ChartWrapper id='presHum' data={data} options={chartOptions} />;
}

PresHumChart.propTypes = {
  id: PropTypes.string,
  data: PropTypes.object,
};
