import { React } from 'react';
import 'chartjs-adapter-luxon';
import PropTypes from 'prop-types';
import ChartWrapper from '../ChartWrapper';
import { chartPlugins } from '../plugins';

export default function TempChart(props) {
  const data = props.data;
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
            day: 'MM/dd',
          },
        },
      },
      y: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        suggestedMax: 35,
        title: {
          display: true,
          text: 'Temperature (°C)',
        },
      },
    },
    plugins: structuredClone(chartPlugins),
  };

  return <ChartWrapper data={data} options={chartOptions} />;
}
TempChart.propTypes = {
  data: PropTypes.object,
};
