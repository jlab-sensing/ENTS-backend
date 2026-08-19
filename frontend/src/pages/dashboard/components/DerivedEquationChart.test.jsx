import { render, screen, waitFor } from '@testing-library/react';
import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DerivedEquationChart from './DerivedEquationChart';

vi.mock('../equation/equationData', async () => {
  const actual = await vi.importActual('../equation/equationData');
  return {
    ...actual,
    buildDerivedSeries: vi.fn(),
    derivedSeriesToChartData: vi.fn((expression, timestamps, values) => ({
      datasets: [
        {
          label: expression,
          data: timestamps.map((x, i) => ({ x, y: values[i] })),
        },
      ],
    })),
  };
});

import { buildDerivedSeries, buildDerivedSeriesFromLiveData } from '../equation/equationData';

describe('DerivedEquationChart', () => {
  const startDate = DateTime.fromISO('2026-06-01T00:00:00');
  const endDate = DateTime.fromISO('2026-06-14T00:00:00');

  beforeEach(() => {
    vi.clearAllMocks();
    buildDerivedSeries.mockResolvedValue({
      timestamps: [1],
      values: [2],
    });
  });

  it('loads derived series from cache when central historical is active', async () => {
    render(
      <DerivedEquationChart
        expression="1:vwc / 1:temp"
        startDate={startDate}
        endDate={endDate}
        stream={false}
        historicalPowerByCell={{}}
        historicalTerosByCell={{ 1: { terosData: { timestamp: [], vwc: [], temp: [] } } }}
        historicalSensorByKey={{}}
        historicalLoading={false}
        centralHistoricalActive
      />,
    );

    await waitFor(() => {
      expect(buildDerivedSeries).toHaveBeenCalledWith(
        '1:vwc / 1:temp',
        startDate,
        endDate,
        'hour',
        expect.objectContaining({
          useCentralCache: true,
          historicalCache: expect.objectContaining({
            historicalTerosByCell: expect.any(Object),
          }),
        }),
      );
    });
  });

  it('renders live derived series from websocket packets', async () => {
    render(
      <DerivedEquationChart
        expression="3:vwc / 3:temp"
        startDate={startDate}
        endDate={endDate}
        stream
        liveData={[
          {
            type: 'teros12',
            cellId: 3,
            timestamp: 1_700_000_000,
            data: { vwcAdj: 0.4, temp: 20, ec: 1 },
          },
        ]}
      />,
    );

    expect(buildDerivedSeries).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByText(/Waiting for live data/i)).not.toBeInTheDocument();
    });
    expect(screen.queryByText(/not available in live stream mode/i)).not.toBeInTheDocument();
    expect(
      buildDerivedSeriesFromLiveData('3:vwc / 3:temp', [
        {
          type: 'teros12',
          cellId: 3,
          timestamp: 1_700_000_000,
          data: { vwcAdj: 0.4, temp: 20, ec: 1 },
        },
      ])?.values,
    ).toEqual([2]);
  });

  it('shows waiting message in live mode until all operands arrive', () => {
    render(
      <DerivedEquationChart
        expression="3:voltage / 3:temp"
        startDate={startDate}
        endDate={endDate}
        stream
        liveData={[
          {
            type: 'power',
            cellId: 3,
            timestamp: 100,
            data: { voltage: 12, current: 1 },
          },
        ]}
      />,
    );

    expect(screen.getByText(/Waiting for live data for all equation inputs/i)).toBeInTheDocument();
    expect(buildDerivedSeries).not.toHaveBeenCalled();
  });

  it('shows message when no data is returned', async () => {
    buildDerivedSeries.mockResolvedValue(null);

    render(
      <DerivedEquationChart
        expression="1:vwc / 1:temp"
        startDate={startDate}
        endDate={endDate}
        stream={false}
      />,
    );

    expect(await screen.findByText(/No data for this expression/i)).toBeInTheDocument();
  });
});
