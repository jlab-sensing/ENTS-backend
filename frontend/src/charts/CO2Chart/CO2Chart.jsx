import 'chartjs-adapter-luxon';
import PropTypes from 'prop-types';
import { React } from 'react';
import { getAxisBoundsAndStepValues } from '../alignAxis';
import ChartWrapper from '../ChartWrapper';
import { chartPlugins } from '../plugins';

export default function CO2Chart({ data, startDate, endDate }) {
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
      CO2: {
        position: 'left',
        title: {
          display: true,
          text: 'CO2 Concentration (PPM)',
        },
        ticks: {
          stepSize: leftYStep,
        },
        min: leftYMin,
        max: leftYMax,
      },
      Photoresistivity: {
        position: 'right',
        title: {
          display: true,
          text: 'Photoresistivity (Ohms)',
        },
        ticks: {
          stepSize: leftYStep,
        },
        min: leftYMin,
        max: leftYMax,
      },
    },
    plugins: structuredClone(chartPlugins),
  };

  return <ChartWrapper id='CO2' data={data} options={chartOptions} />;
}

CO2Chart.propTypes = {
  id: PropTypes.string,
  data: PropTypes.object,
  startDate: PropTypes.object,
  endDate: PropTypes.object,
};
