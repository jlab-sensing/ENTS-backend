import { act, renderHook, waitFor } from '@testing-library/react';
import { DateTime } from 'luxon';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSmartDateRange } from '../hooks/useSmartDateRange';
import { getDataAvailability } from '../services/dataAvailability';

vi.mock('../services/dataAvailability', () => ({
  getDataAvailability: vi.fn(),
}));

describe('useSmartDateRange', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses latest available timestamp for 2-week window when recent data exists', async () => {
    const latest = DateTime.fromISO('2025-11-24T12:00:00Z');
    getDataAvailability.mockResolvedValue({
      latest_timestamp: latest.toISO(),
      earliest_timestamp: '2025-01-01T00:00:00Z',
      has_recent_data: true,
    });

    const { result } = renderHook(() => useSmartDateRange());

    let output;
    await act(async () => {
      output = await result.current.calculateSmartDateRange([{ id: 10 }]);
    });

    expect(output.isFallback).toBe(false);
    expect(output.endDate.toISO()).toBe(latest.toISO());
    expect(output.startDate.toISO()).toBe(latest.minus({ days: 14 }).toISO());
  });

  it('clamps start date to earliest available timestamp when window would go too far back', async () => {
    const latest = DateTime.fromISO('2025-02-10T00:00:00Z');
    const earliest = DateTime.fromISO('2025-02-05T00:00:00Z');
    getDataAvailability.mockResolvedValue({
      latest_timestamp: latest.toISO(),
      earliest_timestamp: earliest.toISO(),
      has_recent_data: true,
    });

    const { result } = renderHook(() => useSmartDateRange());

    let output;
    await act(async () => {
      output = await result.current.calculateSmartDateRange([{ id: 11 }]);
    });

    expect(output.isFallback).toBe(false);
    expect(output.endDate.toISO()).toBe(latest.toISO());
    expect(output.startDate.toISO()).toBe(earliest.toISO());
  });

  it('returns fallback window and stores notification dates when no recent data exists', async () => {
    const latest = DateTime.fromISO('2025-01-20T06:30:00Z');
    getDataAvailability.mockResolvedValue({
      latest_timestamp: latest.toISO(),
      earliest_timestamp: '2024-01-01T00:00:00Z',
      has_recent_data: false,
    });

    const { result } = renderHook(() => useSmartDateRange());

    let output;
    await act(async () => {
      output = await result.current.calculateSmartDateRange([{ id: 12 }]);
    });

    expect(output.isFallback).toBe(true);
    expect(output.endDate.toISO()).toBe(latest.toISO());
    expect(output.startDate.toISO()).toBe(latest.minus({ days: 14 }).toISO());

    await waitFor(() => {
      expect(result.current.fallbackDates.start).not.toBeNull();
      expect(result.current.fallbackDates.end).not.toBeNull();
    });
    expect(DateTime.fromJSDate(result.current.fallbackDates.end).toISO()).toBe(latest.toISO());
  });

  it('falls back to default range when latest timestamp is invalid', async () => {
    getDataAvailability.mockResolvedValue({
      latest_timestamp: 'invalid',
      earliest_timestamp: null,
      has_recent_data: true,
    });

    const { result } = renderHook(() => useSmartDateRange());

    let output;
    await act(async () => {
      output = await result.current.calculateSmartDateRange([{ id: 13 }]);
    });

    expect(output.isFallback).toBe(false);
    expect(output.endDate.isValid).toBe(true);
    expect(output.startDate.isValid).toBe(true);
    expect(Math.round(output.endDate.diff(output.startDate, 'days').days)).toBe(14);
  });
});
