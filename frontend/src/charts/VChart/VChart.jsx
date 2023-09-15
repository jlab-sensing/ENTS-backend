import { React } from 'react';
import 'chartjs-adapter-luxon';
import PropTypes from 'prop-types';
import ChartWrapper from '../ChartWrapper';
import { chartPlugins } from '../plugins';
export default function VChart({ data }) {
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
          text: 'Cell Voltage (mV)',
        },
        min: 0,
        max: 400,
        // ticks: {
        //   stepSize: 50,
        // },
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
        min: 0,
        max: 160,
        // ticks: {
        //   stepSize: 20,
        // },
      },
    },
    plugins: structuredClone(chartPlugins),
  };

  return <ChartWrapper id='v' data={data} options={chartOptions} />;
}

VChart.propTypes = {
  data: PropTypes.object,
};
