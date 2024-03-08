import { describe, test, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CellSelect from '../pages/dashboard/components/CellSelect';

const queryClient = new QueryClient();

//** integration test: service calls on dashboard */
describe('Loading dashboard', () => {
  test('Fetch and display cells to add', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={queryClient}>
        <CellSelect selectedCells={[]} setSelectedCells={() => {}} />
      </QueryClientProvider>,
    );
    expect(await screen.findByText('select-cell')).toBeInTheDocument();
    await user.click(screen.getByRole('button'));
    expect(await screen.findByText('test_cell_1')).toBeInTheDocument();
    expect(await screen.findByText('test_cell_2')).toBeInTheDocument();
  });
});
