import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateTime } from 'luxon';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Dashboard from '../pages/dashboard/Dashboard';

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
    fetchCellSensorsForCells: vi.fn(async (cellIds) => {
      const sensors = {};
      if (cellIds.map(String).includes('1')) {
        sensors['1'] = [{ id: 100, name: 'soil_tension', measurement: 'soil_tension' }];
      }
      if (cellIds.map(String).includes('2')) {
        sensors['2'] = [{ id: 200, name: 'co2', measurement: 'co2' }];
      }
      return sensors;
    }),
    fetchCatalogPanelIdsForCells: vi.fn(async (cellIds) => {
      const ids = new Set();
      if (cellIds.map(String).includes('1')) {
        ids.add('power-vi');
      }
      if (cellIds.map(String).includes('2')) {
        ids.add('power-vi');
      }
      return [...ids];
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
      onClick={() => {
        const remaining = selectedCells.filter((cell) => cell.id !== '2');
        setSelectedCells(remaining);
      }}
    >
      Remove cell 2
    </button>
  ),
}));

vi.mock('../pages/dashboard/components/DashboardPanelGrid', () => ({
  default: ({ panelOrder }) => <div data-testid='panel-order'>{panelOrder.join(',')}</div>,
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid='location-search'>{location.search}</div>;
}

describe('Dashboard cell removal', () => {
  it('prunes orphaned panels when a cell is removed', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/dashboard?cell_id=1,2&layout=v1:vi,s:100,s:200']}>
        <LocationProbe />
        <Dashboard />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('panel-order')).toHaveTextContent('power-vi,s:100,s:200');
    });

    await user.click(screen.getByRole('button', { name: 'Remove cell 2' }));

    await waitFor(() => {
      const panelOrder = screen.getByTestId('panel-order').textContent;
      expect(panelOrder).not.toContain('s:200');
      expect(panelOrder).toContain('s:100');
    });

    await waitFor(() => {
      const search = screen.getByTestId('location-search').textContent;
      expect(search).toContain('layout=v1%3Avi%2Cs%3A100');
      expect(search).not.toContain('s%3A200');
    });
  });
});
