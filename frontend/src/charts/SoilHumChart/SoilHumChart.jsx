import 'chartjs-adapter-luxon';
import PropTypes from 'prop-types';
import { React } from 'react';
import { getAxisBoundsAndStepValues } from '../alignAxis';
import ChartWrapper from '../ChartWrapper';
import { chartPlugins } from '../plugins';

export default function SoilHumChart({ data }) {
  const { leftYMin, leftYMax, leftYStep } = getAxisBoundsAndStepValues(data.datasets, [], 8, 0.2);
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
      /*
      voltage: {
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Voltage (V)',
        },
        ticks: {
          beginAtZero: true,
          stepSize: leftYStep,
        },
        min: leftYMin,
        max: leftYMax,
      },
      */
      humidity: {
        position: 'left',
        title: {
          display: true,
          text: 'Humidity (%)',
        },
        ticks: {
          stepSize: leftYStep,
          //beginAtZero: true,
        },
        min: leftYMin,
        max: leftYMax,
      },
    },
    plugins: structuredClone(chartPlugins),
  };

  return <ChartWrapper id='soilHum' data={data} options={chartOptions} />;
}

SoilHumChart.propTypes = {
  id: PropTypes.string,
  data: PropTypes.object,
  startDate: PropTypes.object,
  endDate: PropTypes.object,
};
