import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';

describe('Loading dashboard', () => {
  //   test('Renders Dashbaord', async () => {
  //     const dash = render(<Dashboard />);
  //     expect(await dash.findByText('Cell')).toBeInTheDocument();
  //   });
  test('Fetch and display cells to add', async () => {
    screen.debug();
    render(<Dashboard />);
    expect(await screen.findByText('test_cell_1')).toBeInTheDocument();
  });
});
