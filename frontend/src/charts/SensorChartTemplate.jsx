import 'chartjs-adapter-luxon';
import PropTypes from 'prop-types';
import { React } from 'react';
import { getMaxAxisAndStepValues } from './alignAxis';
import ChartWrapper from './ChartWrapper';
import { chartPlugins } from './plugins';

export default function SensorChartTemplate({ data, startDate, endDate }) {
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
        min: startDate?.toJSDate(),
        max: endDate?.toJSDate(),
      },
      leafAxis: {
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Leaf Wetness (V)',
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

  return <ChartWrapper id='vwc' data={data} options={chartOptions} />;
}

SensorChartTemplate.propTypes = {
  id: PropTypes.string,
  data: PropTypes.object,
  startDate: PropTypes.object,
  endDate: PropTypes.object,
};
