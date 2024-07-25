import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CellSelect from '../pages/dashboard/components/CellSelect';
import ChartWrapper from '../charts/ChartWrapper';

const queryClient = new QueryClient();
const mockedSetSelectedCells = vi.fn();

const MockCellSelect = (selectedCells, setSelectedCells) => {
  return (
    <QueryClientProvider client={queryClient}>
      <CellSelect selectedCells={[]} setSelectedCells={() => {}} />
    </QueryClientProvider>
  );
};

const MockChartWrapper = () => {
  <ChartWrapper />;
};

//** integration test: service calls on dashboard */
describe('Loading dashboard', () => {
  it('should load cell select as unselected', async () => {
    render(<MockCellSelect selectedCells={[]} mockedSetSelectedCells={mockedSetSelectedCells} />);
    const cellSelectElement = await screen.findByText('select-cell');
    expect(cellSelectElement).toBeInTheDocument();
  });

  it('should display mocked cell names when dropdown is open', async () => {
    const user = userEvent.setup();
    render(<MockCellSelect selectedCells={[]} mockedSetSelectedCells={mockedSetSelectedCells} />);
    const cellDropDownButton = screen.getByRole('button');
    await user.click(cellDropDownButton);
    expect(await screen.findByText('test_cell_1')).toBeInTheDocument();
    expect(await screen.findByText('test_cell_2')).toBeInTheDocument();
  });

  it('should render charts with titles', async () => {});
});
