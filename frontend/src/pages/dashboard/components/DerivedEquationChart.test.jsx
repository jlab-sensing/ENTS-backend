import { render, screen, waitFor } from '@testing-library/react';
import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DerivedEquationChart from './DerivedEquationChart';

vi.mock('../equation/equationData', () => ({
  buildDerivedSeries: vi.fn(),
  derivedSeriesToChartData: vi.fn(() => ({
    datasets: [{ label: '1:vwc / 1:temp', data: [{ x: 1, y: 2 }] }],
  })),
}));

import { buildDerivedSeries } from '../equation/equationData';

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

  it('shows live mode placeholder', () => {
    render(
      <DerivedEquationChart
        expression="1:vwc / 1:temp"
        startDate={startDate}
        endDate={endDate}
        stream
      />,
    );

    expect(screen.getByText(/not available in live stream mode/i)).toBeInTheDocument();
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
