import 'chartjs-adapter-luxon';
import PropTypes from 'prop-types';
import { React } from 'react';
import { getAxisBoundsAndStepValues } from '../alignAxis';
import ChartWrapper from '../ChartWrapper';
import { chartPlugins } from '../plugins';

export default function CO2Chart({ data, startDate, endDate }) {
  console.log('[DEBUG] All yAxisIDs:', data.datasets.map(d => d.yAxisID));

  const { leftYMin, leftYMax, leftYStep, rightYMin, rightYMax, rightYStep } = getAxisBoundsAndStepValues(
  data.datasets.filter(d => d.yAxisID === 'PhotoresistivityAxis'),
  data.datasets.filter(d => d.yAxisID === 'CO2Axis'),
  8,
  0.2
  );

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
      CO2Axis: {
        position: 'left',
        title: {
          display: true,
          text: 'CO2 Concentration (PPM)',
        },
      ticks: {
        stepSize: rightYStep,
        callback: function (value) {
          if (value === 0) return '0';
          const exp = Math.floor(Math.log10(value));
          const base = value / Math.pow(10, exp);
          return `${base.toFixed(1)}×10^${exp}`;
        },
      },
        min: rightYMin,
        max: rightYMax,
      },
      PhotoresistivityAxis: {
        position: 'right',
        title: {
          display: true,
          text: 'Photoresistivity (Ohms)',
        },
        ticks: {
          stepSize: leftYStep,
          callback: function (value) {
            if (value === 0) return '0';
            const exp = Math.floor(Math.log10(value));
            const base = value / Math.pow(10, exp);
            return `${base.toFixed(1)}×10^${exp}`;
          },
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
