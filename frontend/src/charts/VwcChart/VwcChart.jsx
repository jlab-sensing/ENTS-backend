import { React } from 'react';
import 'chartjs-adapter-luxon';
import PropTypes from 'prop-types';
import Chart from '../Chart';

export default function VwcChart(props) {
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
            day: 'D',
          },
        },
      },
      ecAxis: {
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          text: 'EC (µS/cm)',
        },
      },
      vwcAxis: {
        position: 'left',
        beginAtZero: true,
        suggestedMax: 0.9,
        title: {
          display: true,
          text: 'VWC (%)',
        },
        min: 0,
        grid: {
          drawOnChartArea: false,
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

VwcChart.propTypes = {
  data: PropTypes.object,
};
