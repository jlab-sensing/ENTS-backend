import { React } from 'react';
import 'chartjs-adapter-luxon';
import PropTypes from 'prop-types';
import ChartWrapper from '../ChartWrapper';
import { chartPlugins } from '../plugins';

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
        suggestedMax: 650,
        title: {
          display: true,
          text: 'EC (µS/cm)',
        },
        min: 0,
      },
      vwcAxis: {
        position: 'left',
        beginAtZero: true,
        suggestedMax: 0.65,
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
