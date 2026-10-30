import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { getStatistics } from './statistics';
import { mockStatistics } from '../__mocks__/handlers';

describe('Statistics Service', () => {
  it('successfully fetches platform statistics', async () => {
    const data = await getStatistics();
    expect(data).toEqual(mockStatistics);
    expect(data.total_data_points).toBe(154230);
    expect(data.active_cells).toBe(12);
    expect(data.total_loggers).toBe(8);
    expect(data.total_sites).toBe(5);
    expect(data.total_sensors).toBe(24);
  });

  it('returns all expected fields from the API', async () => {
    const data = await getStatistics();
    expect(data).toHaveProperty('total_cells');
    expect(data).toHaveProperty('active_cells');
    expect(data).toHaveProperty('archived_cells');
    expect(data).toHaveProperty('total_loggers');
    expect(data).toHaveProperty('total_sensors');
    expect(data).toHaveProperty('total_sites');
    expect(data).toHaveProperty('total_data_points');
    expect(data).toHaveProperty('total_uploads');
    expect(data).toHaveProperty('upload_error_rate');
    expect(data).toHaveProperty('upload_success_rate');
    expect(data).toHaveProperty('latest_timestamp');
    expect(data).toHaveProperty('data_breakdown');
    expect(data.data_breakdown).toHaveProperty('power');
    expect(data.data_breakdown).toHaveProperty('teros');
    expect(data.data_breakdown).toHaveProperty('generic');
  });

  it('throws error and logs when axios request fails', async () => {
    const spy = vi
      .spyOn(axios, 'get')
      .mockRejectedValueOnce(new Error('Network error'));
    const consoleSpy = vi
      .spyOn(console, 'log')
      .mockImplementation(() => {});

    await expect(getStatistics()).rejects.toThrow('Network error');
    expect(consoleSpy).toHaveBeenCalled();

    spy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('logs error response data when available', async () => {
    const errorWithResponse = new Error('Bad Request');
    errorWithResponse.response = { data: { message: 'Invalid request' } };

    const spy = vi
      .spyOn(axios, 'get')
      .mockRejectedValueOnce(errorWithResponse);
    const consoleSpy = vi
      .spyOn(console, 'log')
      .mockImplementation(() => {});

    await expect(getStatistics()).rejects.toThrow('Bad Request');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error getting statistics:',
      { message: 'Invalid request' },
    );

    spy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('calls the correct API endpoint', async () => {
    const spy = vi.spyOn(axios, 'get');

    await getStatistics();

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('/api/statistics/'),
    );

    spy.mockRestore();
  });
});
