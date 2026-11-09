import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StatisticsSection from './StatisticsSection';
import * as statsService from '../services/statistics';
import { mockStatistics } from '../__mocks__/handlers';

describe('StatisticsSection Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all 5 stat blocks when data loads successfully', async () => {
    render(<StatisticsSection />);

    // Wait for metrics to load from mock
    await waitFor(() => {
      expect(screen.getAllByText('154.2K').length).toBeGreaterThan(0);
    });

    // Verify all 6 block labels are present
    expect(screen.getByText('Data Points')).toBeInTheDocument();
    expect(screen.getByText('Active Cells')).toBeInTheDocument();
    expect(screen.getByText('Total Cells')).toBeInTheDocument();
    expect(screen.getByText('Total Loggers')).toBeInTheDocument();
    expect(screen.getByText('Total Users')).toBeInTheDocument();
  });

  it('displays correct values from mock data', async () => {
    render(<StatisticsSection />);

    await waitFor(() => {
      expect(screen.getAllByText('154.2K').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('displays subtexts for each stat block', async () => {
    render(<StatisticsSection />);

    await waitFor(() => {
      expect(screen.getAllByText('154.2K').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Measurements recorded')).toBeInTheDocument();
    expect(screen.getByText('Uploaded in the last 24 hours')).toBeInTheDocument();
    expect(screen.getByText('Registered cells')).toBeInTheDocument();
    expect(screen.getByText('Registered hardware units')).toBeInTheDocument();
    expect(screen.getByText('Registered accounts')).toBeInTheDocument();
  });

  it('shows loading dashes before data arrives', () => {
    // Mock a never-resolving promise to keep loading state
    vi.spyOn(statsService, 'getStatistics').mockReturnValue(new Promise(() => {}));

    render(<StatisticsSection />);

    // All blocks should show dash placeholders while loading
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBe(5);
  });

  it('handles error gracefully when API fails', async () => {
    vi.spyOn(statsService, 'getStatistics').mockRejectedValueOnce(
      new Error('Fetch failed'),
    );

    render(<StatisticsSection />);

    await waitFor(() => {
      expect(
        screen.getByText(/Status: Service Unavailable/i),
      ).toBeInTheDocument();
    });
  });

  it('triggers refresh when refresh button is clicked', async () => {
    const spy = vi
      .spyOn(statsService, 'getStatistics')
      .mockResolvedValue(mockStatistics);

    render(<StatisticsSection />);

    await waitFor(() => {
      expect(screen.getAllByText('154.2K').length).toBeGreaterThan(0);
    });

    const refreshButton = screen.getByRole('button', {
      name: /refresh statistics/i,
    });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  it('shows last uplink timestamp when available', async () => {
    render(<StatisticsSection />);

    await waitFor(() => {
      expect(screen.getAllByText('154.2K').length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/Last uplink:/i)).toBeInTheDocument();
  });

  it('handles invalid timestamp gracefully in formatDate', async () => {
    const statsWithInvalidDate = {
      ...mockStatistics,
      latest_timestamp: 'invalid-date-string',
    };
    vi.spyOn(statsService, 'getStatistics').mockResolvedValue(statsWithInvalidDate);

    render(<StatisticsSection />);

    await waitFor(() => {
      expect(screen.getByText(/Last uplink: invalid-date-string/i)).toBeInTheDocument();
    });
  });

  it('formats large numbers with compact notation', async () => {
    const largeStats = {
      ...mockStatistics,
      total_data_points: 2500000,
      total_users: 150000,
      active_cells: 1200000000,
    };
    vi.spyOn(statsService, 'getStatistics').mockResolvedValue(largeStats);

    render(<StatisticsSection />);

    await waitFor(() => {
      // 2.5M for data points
      expect(screen.getByText('2.5M')).toBeInTheDocument();
    });

    // 150K for users
    expect(screen.getByText('150K')).toBeInTheDocument();
    // 1.2B for active cells
    expect(screen.getByText('1.2B')).toBeInTheDocument();
  });

  it('handles zero values correctly', async () => {
    const zeroStats = {
      total_cells: 0,
      active_cells: 0,
      archived_cells: 0,
      total_loggers: 0,
      total_users: 0,
      total_data_points: 0,
      latest_timestamp: null,
      data_breakdown: { power: 0, teros: 0, generic: 0 },
    };
    vi.spyOn(statsService, 'getStatistics').mockResolvedValue(zeroStats);

    render(<StatisticsSection />);

    await waitFor(() => {
      expect(screen.getAllByText('0').length).toBe(5);
    });

    // All numeric blocks should show 0
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBe(5);

    // No "Last uplink" when timestamp is null
    expect(screen.queryByText(/Last uplink:/i)).not.toBeInTheDocument();
  });

  it('renders the statistics section with correct id', async () => {
    const { container } = render(<StatisticsSection />);

    const section = container.querySelector('#statistics-section');
    expect(section).toBeInTheDocument();
  });
});
