import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DateTime } from 'luxon';
import { Chart as ChartJS } from 'chart.js';
import VChart from '../VChart/VChart';
import VwcChart from '../VwcChart/VwcChart';
import PwrChart from '../PwrChart/PwrChart';
import TempChart from '../TempChart/TempChart';
import UniversalChart from '../UniversalChart';

const startDate = DateTime.fromISO('2026-01-27T08:00:00.000Z');
const endDate = DateTime.fromISO('2026-02-04T08:00:00.000Z');

const vChartData = {
  labels: [],
  datasets: [
    {
      label: 'Voltage',
      data: [
        { x: 1769500800000, y: 3270 },
        { x: 1769587200000, y: 3275 },
      ],
      yAxisID: 'vAxis',
      borderColor: '#26C6DA',
    },
    {
      label: 'Current',
      data: [
        { x: 1769500800000, y: 1.35 },
        { x: 1769587200000, y: 1.4 },
      ],
      yAxisID: 'cAxis',
      borderColor: '#112E51',
    },
  ],
};

const vwcChartData = {
  labels: [],
  datasets: [
    {
      label: 'VWC',
      data: [
        { x: 1769500800000, y: 3.12 },
        { x: 1769587200000, y: 3.1 },
      ],
      yAxisID: 'vwcAxis',
      borderColor: '#112E51',
    },
    {
      label: 'EC',
      data: [
        { x: 1769500800000, y: 304 },
        { x: 1769587200000, y: 303 },
      ],
      yAxisID: 'ecAxis',
      borderColor: '#26C6DA',
    },
  ],
};

const singleAxisData = {
  labels: [],
  datasets: [
    {
      label: 'Single Axis',
      data: [
        { x: 1769500800000, y: 10 },
        { x: 1769587200000, y: 12 },
      ],
      yAxisID: 'y',
      borderColor: '#26C6DA',
    },
  ],
};

async function expectChartUsesSelectedTimeDomain() {
  const chartElement = await screen.findByTestId('chart-container');
  const chart = ChartJS.getChart(chartElement);
  expect(chart.scales.x.min).toBe(startDate.toMillis());
  expect(chart.scales.x.max).toBe(endDate.toMillis());
}

async function getRenderedChart() {
  const chartElement = await screen.findByTestId('chart-container');
  return ChartJS.getChart(chartElement);
}

describe('Chart Time Domain', () => {
  it('pins non-stream VChart to selected start/end date', async () => {
    render(<VChart data={vChartData} stream={false} startDate={startDate} endDate={endDate} />);
    await expectChartUsesSelectedTimeDomain();
  });

  it('pins non-stream VwcChart to selected start/end date', async () => {
    render(<VwcChart data={vwcChartData} stream={false} startDate={startDate} endDate={endDate} />);
    await expectChartUsesSelectedTimeDomain();
  });

  it('pins non-stream PwrChart to selected start/end date', async () => {
    render(<PwrChart data={singleAxisData} stream={false} startDate={startDate} endDate={endDate} />);
    await expectChartUsesSelectedTimeDomain();
  });

  it('pins non-stream TempChart to selected start/end date', async () => {
    render(<TempChart data={singleAxisData} stream={false} startDate={startDate} endDate={endDate} />);
    await expectChartUsesSelectedTimeDomain();
  });

  it('pins non-stream UniversalChart to selected start/end date', async () => {
    render(
      <UniversalChart
        data={singleAxisData}
        stream={false}
        chartId='universal-time-domain'
        measurements={['temperature']}
        units={['°C']}
        axisIds={['y']}
        startDate={startDate}
        endDate={endDate}
      />,
    );
    await expectChartUsesSelectedTimeDomain();
  });

  it('does not force min/max in stream mode', async () => {
    render(<VChart data={vChartData} stream startDate={startDate} endDate={endDate} />);
    const chart = await getRenderedChart();
    expect(chart.config.options.scales.x.min).toBeUndefined();
    expect(chart.config.options.scales.x.max).toBeUndefined();
  });

  it('falls back to auto domain when dates are invalid', async () => {
    const invalidDate = DateTime.invalid('invalid range');
    render(<PwrChart data={singleAxisData} stream={false} startDate={invalidDate} endDate={endDate} />);
    const chart = await getRenderedChart();
    expect(chart.config.options.scales.x.min).toBeUndefined();
    expect(chart.config.options.scales.x.max).toBeUndefined();
  });

  it('normalizes reversed non-stream date ranges', async () => {
    render(<TempChart data={singleAxisData} stream={false} startDate={endDate} endDate={startDate} />);
    const chart = await getRenderedChart();
    expect(chart.scales.x.min).toBe(startDate.toMillis());
    expect(chart.scales.x.max).toBe(endDate.toMillis());
  });
});
