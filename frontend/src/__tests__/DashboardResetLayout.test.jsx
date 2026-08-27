import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../pages/dashboard/Dashboard';
import { DateTime } from 'luxon';
import * as DataAvailabilityService from '../services/dataAvailability';
import * as CellService from '../services/cell';

const mockSetSearchParams = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', () => ({
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/dashboard' }),
}));

vi.mock('../components/TopNav', () => ({
    default: () => <div data-testid="top-nav">TopNav</div>,
}));

vi.mock('../auth/hooks/useAxiosPrivate', () => ({
    default: () => ({ get: vi.fn(), post: vi.fn() }),
}));

vi.mock('../auth/hooks/useAuth', () => ({
    default: () => ({ loggedIn: true }),
}));

vi.mock('../pages/dashboard/components/PowerCharts', () => ({
    default: () => <div data-testid="power-charts">PowerCharts</div>,
}));

vi.mock('../pages/dashboard/components/TerosCharts', () => ({
    default: () => <div data-testid="teros-charts">TerosCharts</div>,
}));

vi.mock('../pages/dashboard/components/UnifiedChart', () => ({
    default: () => <div data-testid="unified-chart">UnifiedChart</div>,
}));

vi.mock('../services/cell', () => ({
    useCells: vi.fn(),
    useSetCellArchive: vi.fn(),
    getCellSensors: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../services/dataAvailability', () => ({
    getDataAvailability: vi.fn(),
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

describe('Dashboard Reset Layout Button', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    const mockCells = [
        { id: 1, name: 'Cell 1' },
        { id: 2, name: 'Cell 2' },
    ];

    it('should show reset button when cells are selected and reset parameters when clicked', async () => {
        const user = userEvent.setup();

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

        mockSearchParams.set('cell_id', '1,2');
        mockSearchParams.set('layout', 'custom_layout');
        mockSearchParams.set('startDate', '2023-01-01T00:00:00Z');
        mockSearchParams.set('endDate', '2023-01-31T00:00:00Z');

        render(
            <QueryClientProvider client={queryClient}>
                <Dashboard />
            </QueryClientProvider>
        );

        const resetButtons = await screen.findAllByRole('button', { name: /Reset/i });
        expect(resetButtons.length).toBeGreaterThan(0);

        // Clear previous calls from initial render
        mockSetSearchParams.mockClear();

        await user.click(resetButtons[0]);

        expect(mockSetSearchParams).toHaveBeenCalled();
        
        // Grab the parameters passed to the latest setSearchParams call
        const newParams = mockSetSearchParams.mock.lastCall[0];
        
        expect(newParams.has('cell_id')).toBe(false);
        expect(newParams.has('layout')).toBe(false);
        expect(newParams.has('startDate')).toBe(false);
        expect(newParams.has('endDate')).toBe(false);
    });
});
