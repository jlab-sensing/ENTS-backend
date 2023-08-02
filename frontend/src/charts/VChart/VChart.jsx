import { React } from 'react';
import 'chartjs-adapter-luxon';
import PropTypes from 'prop-types';
import Chart from '../Chart';

export default function VChart(props) {
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
            hour: 'hh:mm',
            day: 'D',
          },
        },
      },
      vAxis: {
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cell Voltage (V)',
        },
        suggestedMax: 0.28,
        min: 0,
        stepSize: 5,
        grid: {
          drawOnChartArea: false,
        },
      },
      cAxis: {
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Current (µA)',
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

VChart.propTypes = {
  data: PropTypes.object,
};
