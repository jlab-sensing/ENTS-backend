import 'chartjs-adapter-luxon';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import { React } from 'react';
import { getAxisBoundsAndStepValues } from '../alignAxis';
import ChartWrapper from '../ChartWrapper';

export default function VChart({ data, stream, startDate, endDate }) {
  const { leftYMin, leftYMax, leftYStep, rightYMin, rightYMax, rightYStep } = getAxisBoundsAndStepValues(
    data.datasets.filter((_, i) => i % 2 == 0),
    data.datasets.filter((_, i) => i % 2 == 1),
    10,
    10,
  );

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    parsing: false,
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
        min: stream ? undefined : startDate?.toJSDate(),
        max: stream ? undefined : endDate?.toJSDate(),
      },
      vAxis: {
        position: 'left',
        title: {
          display: true,
          text: 'Cell Voltage (mV)',
        },
        ticks: {
          stepSize: leftYStep,
        },
        min: leftYMin,
        max: leftYMax,
        grid: {
          drawOnChartArea: false,
        },
      },
      cAxis: {
        position: 'right',
        title: {
          display: true,
          text: 'Current (µA)',
        },
        ticks: {
          stepSize: rightYStep,
        },
        min: rightYMin,
        max: rightYMax,
      },
    },
  };

  const streamChartOptions = {
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
          padding: 15,
        },
        grid: {
          tickLength: 15,
        },
        time: {
          displayFormats: {
            second: 'hh:mm:ss',
            minute: 'hh:mm',
            hour: 'hh:mm a',
            day: 'D',
          },
        },
        suggestedMin: DateTime.now().minus({ second: 10 }).toJSON(),
        suggestedMax: DateTime.now().toJSON(),
      },
      vAxis: {
        type: 'linear',
        grace: '10%',
        position: 'left',
        title: {
          display: true,
          text: 'Cell Voltage (mV)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      cAxis: {
        type: 'linear',
        grace: '10%',
        position: 'right',
        title: {
          display: true,
          text: 'Current (µA)',
        },
      },
    },
  };

  return <ChartWrapper id='v' data={data} options={stream ? streamChartOptions : chartOptions} stream={stream} />;
}

VChart.propTypes = {
  data: PropTypes.object,
  stream: PropTypes.bool,
  startDate: PropTypes.object,
  endDate: PropTypes.object,
};
