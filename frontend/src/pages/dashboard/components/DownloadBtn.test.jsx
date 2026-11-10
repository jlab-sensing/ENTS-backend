import { buttonClasses } from '@mui/material';
import { fireEvent, render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import DownloadBtn from './DownloadBtn';

describe('DownloadBtn', () => {
  let createObjectURL;
  let revokeObjectURL;

  beforeEach(() => {
    vi.useFakeTimers();
    createObjectURL = vi.fn(() => 'blob:csv');
    revokeObjectURL = vi.fn();
    window.URL.createObjectURL = createObjectURL;
    window.URL.revokeObjectURL = revokeObjectURL;
  });

  afterEach(() => {
    vi.useRealTimers();
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
    act(() => {
      vi.runAllTimers();
    });

    expect(createObjectURL).toHaveBeenCalled();
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toContain('text/csv');
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalled();
  });

  it('downloads one csv file per selected cell', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const appendSpy = vi.spyOn(document.body, 'appendChild');

    render(
      <DownloadBtn
        cells={[
          { id: 1, name: 'Cell A' },
          { id: 2, name: 'Cell B' },
        ]}
        panelOrder={['power-p']}
        historicalPowerByCell={{
          1: {
            powerData: {
              timestamp: ['Thu, 01 Jan 2026 00:00:00 GMT'],
              p: [1],
            },
          },
          2: {
            powerData: {
              timestamp: ['Thu, 01 Jan 2026 00:00:00 GMT'],
              p: [2],
            },
          },
        }}
        historicalTerosByCell={{}}
        historicalSensorByKey={{}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Export to CSV/i }));
    act(() => {
      vi.runAllTimers();
    });

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(clickSpy).toHaveBeenCalledTimes(2);

    const anchors = appendSpy.mock.calls
      .map(([node]) => node)
      .filter((node) => node?.tagName === 'A');
    expect(anchors.map((a) => a.download)).toEqual(['Cell_A.csv', 'Cell_B.csv']);
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

    expect(screen.getByRole('button', { name: /Export to CSV/i })).toBeDisabled();
  });

  it.each([
    ['nothing has loaded', {}],
    [
      'only another cell has sensor data',
      { '2:teros12:vwc': { timestamp: ['Thu, 01 Jan 2026 00:00:00 GMT'], data: [1] } },
    ],
  ])('is greyed out when the selected cells have no data (%s)', (_, historicalSensorByKey) => {
    render(
      <DownloadBtn
        cells={[{ id: 1, name: 'Cell A' }]}
        panelOrder={['power-vi']}
        historicalPowerByCell={{}}
        historicalTerosByCell={{}}
        historicalSensorByKey={historicalSensorByKey}
      />,
    );

    expect(screen.getByRole('button', { name: /Export to CSV/i })).toBeDisabled();
  });

  it.each([
    [
      'TEROS',
      { historicalTerosByCell: { 1: { terosData: { timestamp: ['Thu, 01 Jan 2026 00:00:00 GMT'], vwc: [1] } } } },
    ],
    [
      'sensor',
      { historicalSensorByKey: { '1:teros12:vwc': { timestamp: ['Thu, 01 Jan 2026 00:00:00 GMT'], data: [1] } } },
    ],
  ])('is enabled when the selected cell has %s data', (_, caches) => {
    render(
      <DownloadBtn
        cells={[{ id: 1, name: 'Cell A' }]}
        panelOrder={['teros']}
        historicalPowerByCell={{}}
        historicalTerosByCell={{}}
        historicalSensorByKey={{}}
        {...caches}
      />,
    );

    expect(screen.getByRole('button', { name: /Export to CSV/i })).toBeEnabled();
  });

  it('turns green while a download is in progress and returns to blue afterwards', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(
      <DownloadBtn
        cells={[
          { id: 1, name: 'Cell A' },
          { id: 2, name: 'Cell B' },
        ]}
        panelOrder={['power-p']}
        historicalPowerByCell={{
          1: { powerData: { timestamp: ['Thu, 01 Jan 2026 00:00:00 GMT'], p: [1] } },
          2: { powerData: { timestamp: ['Thu, 01 Jan 2026 00:00:00 GMT'], p: [2] } },
        }}
        historicalTerosByCell={{}}
        historicalSensorByKey={{}}
      />,
    );

    const button = screen.getByRole('button', { name: /Export to CSV/i });
    expect(button).toHaveClass(buttonClasses.colorPrimary);

    fireEvent.click(button);
    expect(button).toHaveTextContent(/DOWNLOADING/i);
    expect(button).toHaveClass(buttonClasses.colorSuccess);

    act(() => {
      vi.runAllTimers();
    });

    expect(button).toHaveTextContent(/Export to CSV/i);
    expect(button).toHaveClass(buttonClasses.colorPrimary);
  });

  it('ignores clicks while a download is in progress', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(
      <DownloadBtn
        cells={[{ id: 1, name: 'Cell A' }]}
        panelOrder={['power-p']}
        historicalPowerByCell={{ 1: { powerData: { timestamp: ['Thu, 01 Jan 2026 00:00:00 GMT'], p: [1] } } }}
        historicalTerosByCell={{}}
        historicalSensorByKey={{}}
      />,
    );

    const button = screen.getByRole('button', { name: /Export to CSV/i });
    fireEvent.click(button);
    fireEvent.click(button);
    act(() => {
      vi.runAllTimers();
    });

    expect(createObjectURL).toHaveBeenCalledTimes(1);
  });
});
