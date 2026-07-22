import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import DownloadBtn from './DownloadBtn';

describe('DownloadBtn', () => {
  let createObjectURL;
  let revokeObjectURL;

  beforeEach(() => {
    createObjectURL = vi.fn(() => 'blob:csv');
    revokeObjectURL = vi.fn();
    window.URL.createObjectURL = createObjectURL;
    window.URL.revokeObjectURL = revokeObjectURL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads a csv built from historical chart caches', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(
      <DownloadBtn
        cells={[{ id: 1, name: 'Cell A' }]}
        panelOrder={['power-vi']}
        historicalPowerByCell={{
          1: {
            powerData: {
              timestamp: ['Thu, 01 Jan 2026 00:00:00 GMT'],
              v: [1.2],
              i: [0.3],
              p: [4],
            },
          },
        }}
        historicalTerosByCell={{}}
        historicalSensorByKey={{}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Export to CSV/i }));

    expect(createObjectURL).toHaveBeenCalled();
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toContain('text/csv');
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
  });

  it('disables export while historical data is loading', () => {
    render(
      <DownloadBtn
        cells={[{ id: 1, name: 'Cell A' }]}
        panelOrder={['power-vi']}
        historicalLoading
        historicalPowerByCell={{}}
        historicalTerosByCell={{}}
        historicalSensorByKey={{}}
      />,
    );

    expect(screen.getByRole('button', { name: /DOWNLOADING/i })).toBeDisabled();
  });
});
