import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateTime } from 'luxon';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Dashboard from '../pages/dashboard/Dashboard';

const catalogRequest = vi.hoisted(() => ({ resolveAddedCells: null }));

vi.mock('../services/cell', () => {
  const data = [
    { id: '1', name: 'cell-1', archive: false },
    { id: '2', name: 'cell-2', archive: false },
  ];
  return {
    useCells: () => ({ data, isLoading: false, isError: false }),
  };
});

vi.mock('../auth/hooks/useAxiosPrivate', () => ({
  default: () => ({ get: vi.fn(), post: vi.fn() }),
}));

vi.mock('../auth/hooks/useAuth', () => ({
  default: () => ({ loggedIn: true }),
}));

vi.mock('../hooks/useSmartDateRange', () => ({
  useSmartDateRange: (() => {
    const calculateSmartDateRange = vi.fn(async () => ({
      startDate: DateTime.now().minus({ days: 14 }),
      endDate: DateTime.now(),
      isFallback: false,
    }));
    const showFallbackNotificationHandler = vi.fn();
    const hideFallbackNotification = vi.fn();
    const fallbackDates = { start: DateTime.now(), end: DateTime.now() };

    return () => ({
      calculateSmartDateRange,
      showFallbackNotification: false,
      fallbackDates,
      showFallbackNotificationHandler,
      hideFallbackNotification,
    });
  })(),
}));

vi.mock('../pages/dashboard/hooks/useDashboardHistoricalData', () => ({
  useDashboardHistoricalData: () => ({
    historicalPowerByCell: {},
    historicalTerosByCell: {},
    historicalSensorByKey: {},
    historicalLoading: false,
  }),
}));

vi.mock('../pages/dashboard/catalog/cellSensorLayout', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchCellSensorsForCells: vi.fn(async () => ({})),
    fetchCatalogPanelIdsForCells: vi.fn((cellIds) => {
      if (cellIds.map(String).includes('2')) {
        return new Promise((resolve) => {
          catalogRequest.resolveAddedCells = () => resolve(['power-vi', 's:2']);
        });
      }
      return Promise.resolve(['power-vi']);
    }),
  };
});

vi.mock('socket.io-client', () => ({
  io: () => ({ on: vi.fn(), off: vi.fn(), emit: vi.fn(), disconnect: vi.fn() }),
}));

vi.mock('../components/TopNav', () => ({ default: () => null }));
vi.mock('../components/DateRangeNotification', () => ({ default: () => null }));
vi.mock('../components/LayoutMismatchNotification', () => ({ default: () => null }));
vi.mock('../pages/dashboard/components/ArchiveModal', () => ({ default: () => null }));
vi.mock('../pages/dashboard/components/BackBtn', () => ({ default: () => null }));
vi.mock('../pages/dashboard/components/DateRangeSel', () => ({ default: () => null }));
vi.mock('../pages/dashboard/components/DownloadBtn', () => ({ default: () => null }));
vi.mock('../pages/dashboard/components/StreamToggle', () => ({ default: () => null }));
vi.mock('../pages/dashboard/components/DashboardPanelActions', () => ({ default: () => null }));
vi.mock('../pages/dashboard/components/AddChartModal', () => ({ default: () => null }));
vi.mock('../pages/dashboard/components/AddEquationModal', () => ({ default: () => null }));

vi.mock('../pages/dashboard/components/CellSelect', () => ({
  default: ({ selectedCells, setSelectedCells }) => (
    <button
      type='button'
      onClick={() =>
        setSelectedCells([
          ...selectedCells,
          { id: '2', name: 'cell-2', archive: false },
        ])
      }
    >
      Add cell 2
    </button>
  ),
}));

vi.mock('../pages/dashboard/components/DashboardPanelGrid', () => ({
  default: ({ panelOrder }) => <div data-testid='panel-order'>{panelOrder.join(',')}</div>,
}));

describe('Dashboard panel-order loading', () => {
  it('still appends a new cell catalog when URL synchronization rerenders the selection', async () => {
    catalogRequest.resolveAddedCells = null;
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/dashboard?cell_id=1&layout=v1:vi']}>
        <Dashboard />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('panel-order')).toHaveTextContent('power-vi');
    });

    await user.click(screen.getByRole('button', { name: 'Add cell 2' }));
    await waitFor(() => expect(catalogRequest.resolveAddedCells).toBeTypeOf('function'));

    // Let URL synchronization and URL-based cell initialization run before the
    // delayed catalog response. This reproduces the race seen on the dev server.
    await act(async () => {
      await Promise.resolve();
      catalogRequest.resolveAddedCells();
    });

    await waitFor(() => {
      expect(screen.getByTestId('panel-order')).toHaveTextContent('power-vi,s:2');
    });
  });
});
