import { React } from 'react';
import 'chartjs-adapter-luxon';
import PropTypes from 'prop-types';
import ChartWrapper from './ChartWrapper';
import { chartPlugins } from './plugins';

export default function SensorChartTemplate({ data }) {
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
      leafAxis: {
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Leaf Wetness (h2o/cm)',
        },
      },
    },
    plugins: structuredClone(chartPlugins),
  };

  return <ChartWrapper id='vwc' data={data} options={chartOptions} />;
}

SensorChartTemplate.propTypes = {
  id: PropTypes.string,
  data: PropTypes.object,
};
