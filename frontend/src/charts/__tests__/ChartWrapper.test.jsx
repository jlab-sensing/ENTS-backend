import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChartWrapper from '../ChartWrapper';
import { getMaxAxisAndStepValues } from '../alignAxis';
import { DateTime } from 'luxon';
import { Chart as ChartJS } from 'chart.js';
import PropTypes from 'prop-types';

const data = {
  datasets: [
    {
      label: 'test_label_1',
      data: [
        {
          x: 1717092000000,
          y: 33.560097739034404,
        },
        {
          x: 1717095600000,
          y: 33.02371338661374,
        },
        {
          x: 1717099200000,
          y: 32.95556642839305,
        },
        {
          x: 1717102800000,
          y: 32.8339073793597,
        },
        {
          x: 1717106400000,
          y: 32.73383777191601,
        },
        {
          x: 1717110000000,
          y: 32.63669920063599,
        },
        {
          x: 1717113600000,
          y: 32.55215167011296,
        },
        {
          x: 1717117200000,
          y: 32.48034676301022,
        },
        {
          x: 1717120800000,
          y: 32.4163324524363,
        },
        {
          x: 1717124400000,
          y: 32.36722560542942,
        },
        {
          x: 1717128000000,
          y: 32.32874327767308,
        },
        {
          x: 1717131600000,
          y: 32.298087715763316,
        },
        {
          x: 1717135200000,
          y: 32.26551214621335,
        },
        {
          x: 1717138800000,
          y: 32.22706505459998,
        },
        {
          x: 1717142400000,
          y: 32.172161365818276,
        },
        {
          x: 1717146000000,
          y: 32.11733170955372,
        },
        {
          x: 1717149600000,
          y: 32.06151163156207,
        },
        {
          x: 1717153200000,
          y: 32.00316048821652,
        },
        {
          x: 1717156800000,
          y: 31.905169077132616,
        },
        {
          x: 1717160400000,
          y: 31.757087487973166,
        },
        {
          x: 1717164000000,
          y: 31.584444383426437,
        },
        {
          x: 1717167600000,
          y: 31.42000370126643,
        },
        {
          x: 1717171200000,
          y: 31.265800948298267,
        },
        {
          x: 1717174800000,
          y: 31.122501867351783,
        },
        {
          x: 1717178400000,
          y: 31.06891320905183,
        },
        {
          x: 1717182000000,
          y: 31.03999751741015,
        },
        {
          x: 1717185600000,
          y: 31.00656703940381,
        },
        {
          x: 1717189200000,
          y: 30.984148243477815,
        },
      ],
      borderColor: 'orange',
      borderWidth: 2,
      fill: false,
      yAxisID: 'vwcAxis',
      radius: 2,
      pointRadius: 1,
    },
    {
      label: 'test_label_2',
      data: [
        {
          x: 1717092000000,
          y: 496,
        },
        {
          x: 1717095600000,
          y: 469,
        },
        {
          x: 1717099200000,
          y: 480,
        },
        {
          x: 1717102800000,
          y: 484,
        },
        {
          x: 1717106400000,
          y: 481,
        },
        {
          x: 1717110000000,
          y: 479,
        },
        {
          x: 1717113600000,
          y: 477,
        },
        {
          x: 1717117200000,
          y: 466,
        },
        {
          x: 1717120800000,
          y: 451,
        },
        {
          x: 1717124400000,
          y: 435,
        },
        {
          x: 1717128000000,
          y: 416,
        },
        {
          x: 1717131600000,
          y: 397,
        },
        {
          x: 1717135200000,
          y: 380,
        },
        {
          x: 1717138800000,
          y: 366,
        },
        {
          x: 1717142400000,
          y: 355,
        },
        {
          x: 1717146000000,
          y: 345,
        },
        {
          x: 1717149600000,
          y: 335,
        },
        {
          x: 1717153200000,
          y: 328,
        },
        {
          x: 1717156800000,
          y: 320,
        },
        {
          x: 1717160400000,
          y: 315,
        },
        {
          x: 1717164000000,
          y: 309,
        },
        {
          x: 1717167600000,
          y: 306,
        },
        {
          x: 1717171200000,
          y: 304,
        },
        {
          x: 1717174800000,
          y: 302,
        },
        {
          x: 1717178400000,
          y: 302,
        },
        {
          x: 1717182000000,
          y: 303,
        },
        {
          x: 1717185600000,
          y: 305,
        },
        {
          x: 1717189200000,
          y: 304,
        },
      ],
      borderColor: 'purple',
      borderWidth: 2,
      fill: false,
      yAxisID: 'ecAxis',
      radius: 2,
      pointRadius: 0,
      borderDash: [5, 5],
    },
  ],
  labels: [],
};

// VWC chart options
const { leftYMax, rightYMax, leftYStep, rightYStep } = getMaxAxisAndStepValues(
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
    },
    ecAxis: {
      type: 'linear',
      position: 'right',
      beginAtZero: true,
      suggestedMax: 650,
      title: {
        display: true,
        text: 'EC (µS/cm)',
      },
      ticks: {
        beginAtZero: true,
        stepSize: rightYStep,
      },
      min: 0,
      max: rightYMax,
    },
    vwcAxis: {
      type: 'linear',
      position: 'left',
      beginAtZero: true,
      suggestedMax: 0.65,
      title: {
        display: true,
        text: 'VWC (%)',
      },
      ticks: {
        beginAtZero: true,
        stepSize: leftYStep,
      },
      min: 0,
      max: leftYMax,
      grid: {
        drawOnChartArea: false,
      },
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
    ecAxis: {
      type: 'linear',
      grace: '10%',
      position: 'right',
      beginAtZero: true,
      suggestedMax: 650,
      title: {
        display: true,
        text: 'EC (µS/cm)',
      },
    },
    vwcAxis: {
      type: 'linear',
      grace: '10%',
      position: 'left',
      beginAtZero: true,
      suggestedMax: 0.65,
      title: {
        display: true,
        text: 'VWC (%)',
      },
      grid: {
        drawOnChartArea: false,
      },
    },
  },
};

/* eslint-enable react/prop-types */
const MockChartWrapper = ({ id, data, streamChartOptions, chartOptions, stream }) => {
  return <ChartWrapper id={id} data={data} options={stream ? streamChartOptions : chartOptions} stream={stream} />;
};

MockChartWrapper.propTypes = {
  id: PropTypes.string,
  data: PropTypes.object,
  streamChartOptions: PropTypes.object,
  chartOptions: PropTypes.object,
  stream: PropTypes.bool,
};

//** integration test: service calls on dashboard */
describe('loading charts', () => {
  it('should render chart canvas', async () => {
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const chartElement = await screen.findByTestId(/chart-container/i, { options: { name: '' } });
    expect(chartElement).toBeInTheDocument();
  });

  it('should render chart labels', async () => {
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const chartElement = await screen.findByTestId(/chart-container/i, { options: { name: '' } });
    expect(chartElement).toBeInTheDocument();
  });

  it('should render reset button', async () => {
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const resetBtnElement = await screen.findByLabelText(/Reset/i);
    expect(resetBtnElement).toBeInTheDocument();
  });

  it('should render box zoom button', async () => {
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const boxZoomBtnElement = await screen.findByLabelText(/^Zoom$/);
    expect(boxZoomBtnElement).toBeInTheDocument();
  });

  it('should render pan button', async () => {
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const panBtnElement = await screen.findByLabelText(/Pan/i);
    expect(panBtnElement).toBeInTheDocument();
  });

  it('should render zoom in button', async () => {
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const zoomInBtnElement = await screen.findByLabelText(/Zoom In/i);
    expect(zoomInBtnElement).toBeInTheDocument();
  });

  it('should render zoom out button', async () => {
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const zoomOutBtnElement = await screen.findByLabelText(/Zoom Out/i);
    expect(zoomOutBtnElement).toBeInTheDocument();
  });

  it('should render downsample button', async () => {
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const downsampleBtnElement = await screen.findByLabelText(/Downsample/i);
    expect(downsampleBtnElement).toBeInTheDocument();
  });

  it('should render fullscreen button', async () => {
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const fullscreenBtnElement = await screen.findByLabelText(/Fullscreen/i);
    expect(fullscreenBtnElement).toBeInTheDocument();
  });
});

describe('testing side button events', () => {
  it('should toggle zoom', async () => {
    const user = userEvent.setup();
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const chartElement = await screen.findByTestId(/chart-container/i);
    const zoomBtnElement = await screen.findByLabelText(/^Zoom$/);
    expect(ChartJS.getChart(chartElement).config.options.plugins.zoom.zoom.drag.enabled).toBe(false);
    await user.click(zoomBtnElement);
    expect(ChartJS.getChart(chartElement).config.options.plugins.zoom.zoom.drag.enabled).toBe(true);
  });

  it('should toggle pan', async () => {
    const user = userEvent.setup();
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const chartElement = await screen.findByTestId(/chart-container/i);
    const panBtnElement = await screen.findByLabelText(/^Pan$/);
    expect(ChartJS.getChart(chartElement).options.plugins.zoom.pan.enabled).toBe(true);
    await user.click(panBtnElement);
    expect(ChartJS.getChart(chartElement).options.plugins.zoom.pan.enabled).toBe(false);
  });

  it('should untoggle pan when zoom is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const chartElement = await screen.findByTestId(/chart-container/i);
    const zoomBtnElement = await screen.findByLabelText(/^Zoom$/);
    expect(ChartJS.getChart(chartElement).options.plugins.zoom.pan.enabled).toBe(true);
    expect(ChartJS.getChart(chartElement).config.options.plugins.zoom.zoom.drag.enabled).toBe(false);
    await user.click(zoomBtnElement);
    expect(ChartJS.getChart(chartElement).config.options.plugins.zoom.zoom.drag.enabled).toBe(true);
    expect(ChartJS.getChart(chartElement).options.plugins.zoom.pan.enabled).toBe(false);
  });

  it('should untoggle zoom when pan is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const chartElement = await screen.findByTestId(/chart-container/i);
    const panBtnElement = await screen.findByLabelText(/^Pan$/);
    const zoomBtnElement = await screen.findByLabelText(/^Zoom$/);
    expect(ChartJS.getChart(chartElement).options.plugins.zoom.pan.enabled).toBe(true);
    expect(ChartJS.getChart(chartElement).config.options.plugins.zoom.zoom.drag.enabled).toBe(false);
    await user.click(zoomBtnElement);
    expect(ChartJS.getChart(chartElement).config.options.plugins.zoom.zoom.drag.enabled).toBe(true);
    expect(ChartJS.getChart(chartElement).options.plugins.zoom.pan.enabled).toBe(false);
    await user.click(panBtnElement);
    expect(ChartJS.getChart(chartElement).config.options.plugins.zoom.zoom.drag.enabled).toBe(false);
    expect(ChartJS.getChart(chartElement).options.plugins.zoom.pan.enabled).toBe(true);
  });

  it('should zoom in chart by 1.1', async () => {
    const user = userEvent.setup();
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const chartElement = await screen.findByTestId(/chart-container/i);
    const zoomInBtnElement = await screen.findByLabelText(/Zoom In/i);
    expect(ChartJS.getChart(chartElement).getZoomLevel()).toBe(1);
    await user.click(zoomInBtnElement);
    expect(ChartJS.getChart(chartElement).getZoomLevel()).toBe(1.11);
  });

  it('should zoom chart out by .9', async () => {
    const user = userEvent.setup();
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const chartElement = await screen.findByTestId(/chart-container/i);
    const zoomOutBtnElement = await screen.findByLabelText(/Zoom Out/i);
    expect(ChartJS.getChart(chartElement).getZoomLevel()).toBe(1);
    await user.click(zoomOutBtnElement);
    expect(ChartJS.getChart(chartElement).getZoomLevel()).toBe(0.91);
  });

  it('should toggle downsample', async () => {
    const user = userEvent.setup();
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const chartElement = await screen.findByTestId(/chart-container/i);
    const downsampleBtnElement = await screen.findByLabelText(/Downsample/i);
    expect(ChartJS.getChart(chartElement).config.options.plugins.decimation.enabled).toBe(true);
    await user.click(downsampleBtnElement);
    expect(ChartJS.getChart(chartElement).config.options.plugins.decimation.enabled).toBe(false);
  });

  it('should reset chart zoom', async () => {
    const user = userEvent.setup();
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const chartElement = await screen.findByTestId(/chart-container/i);
    const resetBtnElement = await screen.findByLabelText(/^Reset$/);
    const zoomInBtnElement = await screen.findByLabelText(/^Zoom In$/);
    expect(ChartJS.getChart(chartElement).getZoomLevel()).toBe(1);
    expect(ChartJS.getChart(chartElement).scales.x.min).toBe(1717092000000);
    expect(ChartJS.getChart(chartElement).scales.x.max).toBe(1717189200000);
    expect(ChartJS.getChart(chartElement).options.plugins.zoom.pan.enabled).toBe(true);
    await user.click(zoomInBtnElement);
    await user.click(zoomInBtnElement);
    await user.click(zoomInBtnElement);
    expect(ChartJS.getChart(chartElement).getZoomLevel()).toBe(1.37);
    expect(ChartJS.getChart(chartElement).scales.x.min).toBe(1717092000000);
    expect(ChartJS.getChart(chartElement).scales.x.max).toBe(1717162858800);
    await user.click(resetBtnElement);
    expect(ChartJS.getChart(chartElement).getZoomLevel()).toBe(1);
    expect(ChartJS.getChart(chartElement).scales.x.min).toBe(1717092000000);
    expect(ChartJS.getChart(chartElement).scales.x.max).toBe(1717189200000);
  });

  it('should toggle fullscreen modal', async () => {
    const user = userEvent.setup();
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const fullscreenBtnElement = await screen.findByLabelText(/Fullscreen/i);
    let fullscreenModalElement = await screen.queryByTestId(/^fullscreen-modal$/);
    expect(fullscreenModalElement).not.toBeInTheDocument();
    await user.click(fullscreenBtnElement);
    fullscreenModalElement = await screen.queryByTestId(/^fullscreen-modal$/);
    expect(fullscreenModalElement).toBeInTheDocument();
  });
});

describe('testing side button events', () => {
  it('should toggle zoom', async () => {
    const user = userEvent.setup();
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const chartElement = await screen.findByTestId(/chart-container/i);
    const zoomBtnElement = await screen.findByLabelText(/^Zoom$/);
    expect(ChartJS.getChart(chartElement).config.options.plugins.zoom.zoom.drag.enabled).toBe(false);
    await user.click(zoomBtnElement);
    expect(ChartJS.getChart(chartElement).config.options.plugins.zoom.zoom.drag.enabled).toBe(true);
  });

  it('should toggle pan', async () => {
    const user = userEvent.setup();
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const chartElement = await screen.findByTestId(/chart-container/i);
    const panBtnElement = await screen.findByLabelText(/^Pan$/);
    expect(ChartJS.getChart(chartElement).options.plugins.zoom.pan.enabled).toBe(true);
    await user.click(panBtnElement);
    expect(ChartJS.getChart(chartElement).options.plugins.zoom.pan.enabled).toBe(false);
  });

  it('should untoggle pan when zoom is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const chartElement = await screen.findByTestId(/chart-container/i);
    const zoomBtnElement = await screen.findByLabelText(/^Zoom$/);
    expect(ChartJS.getChart(chartElement).options.plugins.zoom.pan.enabled).toBe(true);
    expect(ChartJS.getChart(chartElement).config.options.plugins.zoom.zoom.drag.enabled).toBe(false);
    await user.click(zoomBtnElement);
    expect(ChartJS.getChart(chartElement).config.options.plugins.zoom.zoom.drag.enabled).toBe(true);
    expect(ChartJS.getChart(chartElement).options.plugins.zoom.pan.enabled).toBe(false);
  });

  it('should untoggle zoom when pan is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const chartElement = await screen.findByTestId(/chart-container/i);
    const panBtnElement = await screen.findByLabelText(/^Pan$/);
    const zoomBtnElement = await screen.findByLabelText(/^Zoom$/);
    expect(ChartJS.getChart(chartElement).options.plugins.zoom.pan.enabled).toBe(true);
    expect(ChartJS.getChart(chartElement).config.options.plugins.zoom.zoom.drag.enabled).toBe(false);
    await user.click(zoomBtnElement);
    expect(ChartJS.getChart(chartElement).config.options.plugins.zoom.zoom.drag.enabled).toBe(true);
    expect(ChartJS.getChart(chartElement).options.plugins.zoom.pan.enabled).toBe(false);
    await user.click(panBtnElement);
    expect(ChartJS.getChart(chartElement).config.options.plugins.zoom.zoom.drag.enabled).toBe(false);
    expect(ChartJS.getChart(chartElement).options.plugins.zoom.pan.enabled).toBe(true);
  });

  it('should zoom in chart by 1.1', async () => {
    const user = userEvent.setup();
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const chartElement = await screen.findByTestId(/chart-container/i);
    const zoomInBtnElement = await screen.findByLabelText(/Zoom In/i);
    expect(ChartJS.getChart(chartElement).getZoomLevel()).toBe(1);
    await user.click(zoomInBtnElement);
    expect(ChartJS.getChart(chartElement).getZoomLevel()).toBe(1.11);
  });

  it('should zoom chart out by .9', async () => {
    const user = userEvent.setup();
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const chartElement = await screen.findByTestId(/chart-container/i);
    const zoomOutBtnElement = await screen.findByLabelText(/Zoom Out/i);
    expect(ChartJS.getChart(chartElement).getZoomLevel()).toBe(1);
    await user.click(zoomOutBtnElement);
    expect(ChartJS.getChart(chartElement).getZoomLevel()).toBe(0.91);
  });

  it('should toggle downsample', async () => {
    const user = userEvent.setup();
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const chartElement = await screen.findByTestId(/chart-container/i);
    const downsampleBtnElement = await screen.findByLabelText(/Downsample/i);
    expect(ChartJS.getChart(chartElement).config.options.plugins.decimation.enabled).toBe(true);
    await user.click(downsampleBtnElement);
    expect(ChartJS.getChart(chartElement).config.options.plugins.decimation.enabled).toBe(false);
  });

  it('should reset chart zoom', async () => {
    const user = userEvent.setup();
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const chartElement = await screen.findByTestId(/chart-container/i);
    const resetBtnElement = await screen.findByLabelText(/^Reset$/);
    const zoomInBtnElement = await screen.findByLabelText(/^Zoom In$/);
    expect(ChartJS.getChart(chartElement).getZoomLevel()).toBe(1);
    expect(ChartJS.getChart(chartElement).scales.x.min).toBe(1717092000000);
    expect(ChartJS.getChart(chartElement).scales.x.max).toBe(1717189200000);
    expect(ChartJS.getChart(chartElement).options.plugins.zoom.pan.enabled).toBe(true);
    await user.click(zoomInBtnElement);
    await user.click(zoomInBtnElement);
    await user.click(zoomInBtnElement);
    expect(ChartJS.getChart(chartElement).getZoomLevel()).toBe(1.37);
    expect(ChartJS.getChart(chartElement).scales.x.min).toBe(1717092000000);
    expect(ChartJS.getChart(chartElement).scales.x.max).toBe(1717162858800);
    await user.click(resetBtnElement);
    expect(ChartJS.getChart(chartElement).getZoomLevel()).toBe(1);
    expect(ChartJS.getChart(chartElement).scales.x.min).toBe(1717092000000);
    expect(ChartJS.getChart(chartElement).scales.x.max).toBe(1717189200000);
  });

  it('should toggle fullscreen modal', async () => {
    const user = userEvent.setup();
    render(
      <MockChartWrapper
        id='vwc'
        data={data}
        streamChartOptions={streamChartOptions}
        chartOptions={chartOptions}
        stream={false}
      />,
    );
    const fullscreenBtnElement = await screen.findByLabelText(/Fullscreen/i);
    let fullscreenModalElement = await screen.queryByTestId(/^fullscreen-modal$/);
    expect(fullscreenModalElement).not.toBeInTheDocument();
    await user.click(fullscreenBtnElement);
    fullscreenModalElement = await screen.queryByTestId(/^fullscreen-modal$/);
    expect(fullscreenModalElement).toBeInTheDocument();
  });
});

it('should export chart as image when export button is clicked', async () => {
  const user = userEvent.setup();
  
  const mockLink = {
    href: '',
    download: '',
    click: jest.fn()
  };
  
  const originalCreateElement = document.createElement;
  const originalAppendChild = document.body.appendChild;
  const originalRemoveChild = document.body.removeChild;
  
  document.createElement = jest.fn(() => mockLink);
  document.body.appendChild = jest.fn();
  document.body.removeChild = jest.fn();
  
  render(
    <MockChartWrapper
      id='vwc'
      data={data}
      streamChartOptions={streamChartOptions}
      chartOptions={chartOptions}
      stream={false}
    />
  );
  
  const chartElement = await screen.findByTestId(/chart-container/i);
  const chart = ChartJS.getChart(chartElement);
  
  const originalToBase64Image = chart.toBase64Image;
  
  chart.toBase64Image = jest.fn().mockReturnValue('data:image/png;base64,mockImageData');
  
  const exportBtnElement = await screen.findByLabelText(/Export Chart/i);
  await user.click(exportBtnElement);
  
  expect(document.createElement).toHaveBeenCalledWith('a');
  expect(mockLink.href).toBe('data:image/png;base64,mockImageData');
  expect(mockLink.download).toMatch(/chart-vwc-\d{4}-\d{2}-\d{2}\.png/);
  expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
  expect(mockLink.click).toHaveBeenCalled();
  expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
  
  document.createElement = originalCreateElement;
  document.body.appendChild = originalAppendChild;
  document.body.removeChild = originalRemoveChild;
  
  if (originalToBase64Image) {
    chart.toBase64Image = originalToBase64Image;
  }
});
