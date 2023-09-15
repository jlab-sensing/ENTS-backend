import { React } from 'react';
import 'chartjs-adapter-luxon';
import PropTypes from 'prop-types';
import ChartWrapper from '../ChartWrapper';
import { chartPlugins } from '../plugins';

// const defChartData = {
//   label: [],
//   datasets: [
//     {
//       label: 'VWC',
//       data: [],
//       borderColor: 'black',
//       borderWidth: 2,
//       yAxisID: 'vwcAxis',
//     },
//     {
//       label: 'EC',
//       data: [],
//       borderColor: 'black',
//       borderWidth: 2,
//       yAxisID: 'ecAxis',
//     },
//   ],
// };
export default function VwcChart({ data }) {
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
    plugins: structuredClone(chartPlugins),
  };

  return <ChartWrapper id='vwc' data={data} options={chartOptions} />;
}

VwcChart.propTypes = {
  id: PropTypes.string,
  data: PropTypes.object,
};
