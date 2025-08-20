import 'chartjs-adapter-luxon';
import PropTypes from 'prop-types';
import { React } from 'react';
import { getAxisBoundsAndStepValues } from '../alignAxis';
import ChartWrapper from '../ChartWrapper';
import { chartPlugins } from '../plugins';

export default function WaterPressChart({ data, startDate, endDate }) {
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
        min: startDate?.toJSDate(),
        max: endDate?.toJSDate(),
      },
      pressure: {
        position: 'left',
        title: {
          display: true,
          text: 'Water Pressure (kPa)',
        },
        ticks: {
          stepSize: leftYStep,
          //beginAtZero: true,
        },
        min: leftYMin,
        max: leftYMax,
      },
      /*
      voltage: {
        position: 'right',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Voltage (V)',
        },
        ticks: {
          beginAtZero: true,
          stepSize: rightYStep,
        },
        min: rightYMin,
        max: rightYMax,
      },
      */
    },
    plugins: structuredClone(chartPlugins),
  };

  return <ChartWrapper id='waterPress' data={data} options={chartOptions} />;
}

WaterPressChart.propTypes = {
  id: PropTypes.string,
  data: PropTypes.object,
  startDate: PropTypes.object,
  endDate: PropTypes.object,
};
