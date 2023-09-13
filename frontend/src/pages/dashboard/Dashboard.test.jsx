import { describe, test, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CellSelect from './components/CellSelect';

const queryClient = new QueryClient();

const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

describe('Loading dashboard', () => {
  //   test('Renders Dashbaord', async () => {
  //     const dash = render(<Dashboard />);
  //     expect(await dash.findByText('Cell')).toBeInTheDocument();
  //   });
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
