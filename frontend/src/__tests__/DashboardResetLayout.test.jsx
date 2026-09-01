import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../pages/dashboard/Dashboard';
import { DateTime } from 'luxon';
import * as DataAvailabilityService from '../services/dataAvailability';
import * as CellService from '../services/cell';

// Keep responsive branch testing deterministic for desktop/mobile layouts.
const { mockUseMediaQuery } = vi.hoisted(() => ({
  mockUseMediaQuery: vi.fn(() => false),
}));

vi.mock('../components/TopNav', () => ({
  default: () => <div data-testid='top-nav'>TopNav</div>,
}));

vi.mock('../components/DateRangeNotification', () => ({
  default: () => <div data-testid='date-range-notification' />,
}));

vi.mock('../pages/dashboard/components/LayoutMismatchNotification', () => ({
  default: () => <div data-testid='layout-mismatch-notification' />,
}));

vi.mock('../components/BackBtn', () => ({
  default: () => <button>Back</button>,
}));

vi.mock('../components/DownloadBtn', () => ({
  default: () => <button>Download</button>,
}));

vi.mock('../components/StreamToggle', () => ({
  default: () => <button>Stream</button>,
}));

vi.mock('../components/DateRangeSel', () => ({
  default: () => <div>DateRangeSel</div>,
}));

vi.mock('../pages/dashboard/components/DashboardPanelGrid', () => ({
  default: () => <div>DashboardPanelGrid</div>,
}));

vi.mock('../pages/dashboard/components/AddChartModal', () => ({
  default: () => <div>AddChartModal</div>,
}));

vi.mock('../pages/dashboard/components/AddEquationModal', () => ({
  default: () => <div>AddEquationModal</div>,
}));

vi.mock('../pages/dashboard/components/CellSelect', () => ({
  default: ({ setSelectedCells }) => (
    <button type='button' data-testid='cell-select-mock' onClick={() => setSelectedCells([{ id: 1, name: 'Cell 1' }])}>
      CellSelect
    </button>
  ),
}));

vi.mock('@mui/material', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useMediaQuery: mockUseMediaQuery };
});

vi.mock('socket.io-client', () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
  };

  return { io: vi.fn(() => mockSocket) };
});

vi.mock('../pages/dashboard/hooks/useDashboardHistoricalData', () => ({
  useDashboardHistoricalData: vi.fn(() => ({
    historicalPowerByCell: {},
    historicalTerosByCell: {},
    historicalSensorByKey: {},
    historicalLoading: false,
  })),
}));

vi.mock('../pages/dashboard/catalog/cellSensorLayout', async () => {
  const actual = await vi.importActual('../pages/dashboard/catalog/cellSensorLayout');
  return { ...actual };
});

vi.mock('../pages/dashboard/catalog/dashboardCatalog', async () => {
  const actual = await vi.importActual('../pages/dashboard/catalog/dashboardCatalog');
  return { ...actual };
});

vi.mock('../pages/dashboard/catalog/historicalDataLoader', () => ({
  panelOrderNeedsPower: vi.fn(() => false),
  panelOrderNeedsTeros: vi.fn(() => false),
}));

vi.mock('../services/cell', () => ({
  useCells: vi.fn(),
  useSetCellArchive: vi.fn(),
  getCellSensors: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../services/dataAvailability', () => ({
  getDataAvailability: vi.fn(),
}));

vi.mock('../auth/hooks/useAxiosPrivate', () => ({
  default: () => ({
    get: vi.fn(),
    post: vi.fn(),
  }),
}));

vi.mock('../auth/hooks/useAuth', () => ({
  default: () => ({ loggedIn: true }),
}));

// Shared query client for all dashboard renders in this file.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockCells = [
  { id: 1, name: 'Cell 1' },
  { id: 2, name: 'Cell 2' },
];

const setupServices = () => {
  CellService.useCells.mockReturnValue({
    data: mockCells,
    isLoading: false,
    isError: false,
  });
  CellService.useSetCellArchive.mockReturnValue({ mutate: vi.fn() });
  DataAvailabilityService.getDataAvailability.mockResolvedValue({
    latest_timestamp: DateTime.now().toISO(),
    earliest_timestamp: DateTime.now().minus({ months: 1 }).toISO(),
    has_recent_data: true,
  });
};

const renderDashboard = (initialEntries = ['/dashboard']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    </MemoryRouter>,
  );

describe('Dashboard reset layout', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  beforeEach(() => {
    mockUseMediaQuery.mockReturnValue(false);
    setupServices();
  });

  it('handles cell selection changes', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByTestId('cell-select-mock'));
    expect(await screen.findByRole('button', { name: /Reset Layout/i })).toBeEnabled();
  });

  it('renders desktop reset layout disabled when no cells are selected', async () => {
    renderDashboard();

    const button = await screen.findByRole('button', { name: /Reset Layout/i });
    expect(button).toBeDisabled();
  });

  it('renders desktop reset layout enabled when cells are selected', async () => {
    renderDashboard(['/dashboard?cell_id=1,2']);

    const button = await screen.findByRole('button', { name: /Reset Layout/i });
    expect(button).toBeEnabled();
  });

  it('resets dashboard and clears URL parameters on desktop', async () => {
    const user = userEvent.setup();
    renderDashboard(['/dashboard?cell_id=1,2&layout=custom&startDate=2023-01-01&endDate=2023-01-31']);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Reset Layout/i })).toBeEnabled();
    });
    const button = screen.getByRole('button', { name: /Reset Layout/i });

    await user.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it('renders mobile reset button disabled when no cells are selected', async () => {
    mockUseMediaQuery.mockReturnValue(true);
    renderDashboard();

    const button = await screen.findByRole('button', { name: /^Reset$/i });
    expect(button).toBeDisabled();
  });

  it('renders mobile reset button enabled when cells are selected', async () => {
    mockUseMediaQuery.mockReturnValue(true);
    renderDashboard(['/dashboard?cell_id=1']);

    const button = await screen.findByRole('button', { name: /^Reset$/i });
    expect(button).toBeEnabled();
  });

  it('resets dashboard and clears URL parameters on mobile', async () => {
    const user = userEvent.setup();
    mockUseMediaQuery.mockReturnValue(true);
    renderDashboard(['/dashboard?cell_id=1&layout=cell-1-power&startDate=2023-01-01&endDate=2023-01-31']);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Reset$/i })).toBeEnabled();
    });
    const button = screen.getByRole('button', { name: /^Reset$/i });

    await user.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });
});
