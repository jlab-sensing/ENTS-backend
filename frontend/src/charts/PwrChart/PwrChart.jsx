import { React } from 'react';
import 'chartjs-adapter-luxon';
import PropTypes from 'prop-types';
import Chart from '../Chart';

export default function PwrChart(props) {
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
            day: 'D',
          },
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Power (µV)',
        },
      },
    },
    plugins: {
      zoom: {
        zoom: {
          wheel: {
            enabled: false,
          },
          pinch: {
            enabled: false,
          },
          mode: 'xy',
          scaleMode: 'xy',
        },
        pan: {
          enabled: true,
          mode: 'xy',
        },
      },
    },
  };

  return <Chart data={data} options={chartOptions} />;
}

PwrChart.propTypes = {
  data: PropTypes.object,
};
