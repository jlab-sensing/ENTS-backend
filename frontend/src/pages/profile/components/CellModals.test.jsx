import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../../../auth/AuthContextProvider';
import { addCell, updateCell } from '../../../services/cell';
import AddCellModal from './AddCellModal';
import CellsList from './CellsList';
import EditCellModal from './EditCellModal';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: vi.fn(),
  };
});

vi.mock('../../../services/cell', () => ({
  addCell: vi.fn(),
  updateCell: vi.fn(),
  deleteCell: vi.fn(),
  shareCell: vi.fn(),
}));

vi.mock('../../../services/tag', () => ({
  useTags: () => ({ data: [], isLoading: false }),
  useCreateTag: () => ({ mutateAsync: vi.fn() }),
  useCellTags: () => ({ data: [] }),
  useAssignCellTags: () => ({ mutateAsync: vi.fn().mockResolvedValue({}) }),
}));

import { useOutletContext } from 'react-router-dom';

function renderWithProviders(ui) {
  const queryClient = new QueryClient();
  const authValue = {
    auth: { accessToken: 'test-token' },
    setAuth: vi.fn(),
    user: { email: 'researcher@example.com' },
    setUser: vi.fn(),
    loggedIn: true,
    setLoggedIn: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </AuthContext.Provider>,
  );
}

describe('Cell Modals with Metadata', () => {
  const refetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useOutletContext.mockReturnValue([
      [
        {
          id: 7,
          name: 'Field A',
          location: 'North Plot',
          latitude: 36.97,
          longitude: -122.03,
          archive: false,
          metadata: { sand: 0.4, soil: 'loam' },
        },
      ],
      false,
      false,
      refetch,
      { email: 'researcher@example.com' },
      vi.fn(),
      vi.fn(),
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates a cell with metadata in AddCellModal and resets on close', async () => {
    const user = userEvent.setup({ delay: null });
    addCell.mockResolvedValueOnce({ id: 99, name: 'Station B' });

    renderWithProviders(<AddCellModal />);

    await user.click(screen.getByRole('button'));
    fireEvent.change(screen.getByLabelText(/cell name/i), { target: { value: 'Station B' } });
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: 'South Field' } });
    fireEvent.change(screen.getByLabelText(/latitude/i), { target: { value: '36.97' } });
    fireEvent.change(screen.getByLabelText(/longitude/i), { target: { value: '-122.03' } });

    await user.click(screen.getByRole('button', { name: /add field/i }));
    fireEvent.change(screen.getByLabelText('Key 1'), { target: { value: 'sand' } });
    fireEvent.change(screen.getByLabelText('Value 1'), { target: { value: '0.4' } });

    await user.click(screen.getByRole('button', { name: /add cell/i }));

    await waitFor(() => {
      expect(addCell).toHaveBeenCalledWith(
        'Station B',
        'South Field',
        '-122.03',
        '36.97',
        false,
        'researcher@example.com',
        { sand: 0.4 },
      );
    });
    expect(refetch).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /done/i }));
    await user.click(screen.getByRole('button'));
    expect(screen.queryByLabelText('Key 1')).not.toBeInTheDocument();
  });

  it('disables Add Cell when metadata keys are invalid', async () => {
    const user = userEvent.setup({ delay: null });

    renderWithProviders(<AddCellModal />);

    await user.click(screen.getByRole('button'));
    fireEvent.change(screen.getByLabelText(/cell name/i), { target: { value: 'Station C' } });
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: 'West Field' } });
    fireEvent.change(screen.getByLabelText(/latitude/i), { target: { value: '36.97' } });
    fireEvent.change(screen.getByLabelText(/longitude/i), { target: { value: '-122.03' } });

    await user.click(screen.getByRole('button', { name: /add field/i }));
    fireEvent.change(screen.getByLabelText('Value 1'), { target: { value: '0.5' } });

    expect(screen.getByText('Key is required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add cell/i })).toBeDisabled();
  });

  it('pre-populates and updates metadata in EditCellModal', async () => {
    const user = userEvent.setup({ delay: null });
    updateCell.mockResolvedValueOnce({ id: 7, name: 'Field A' });

    renderWithProviders(
      <EditCellModal
        cell={{
          id: 7,
          name: 'Field A',
          location: 'North Plot',
          lat: 36.97,
          long: -122.03,
          metadata: { sand: 0.4, soil: 'loam' },
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByLabelText('Key 1')).toHaveValue('sand');
    expect(screen.getByLabelText('Value 1')).toHaveValue('0.4');
    expect(screen.getByLabelText('Key 2')).toHaveValue('soil');
    expect(screen.getByLabelText('Value 2')).toHaveValue('loam');

    await user.click(screen.getByRole('button', { name: 'Remove metadata field 2' }));
    await user.click(screen.getByRole('button', { name: /add field/i }));
    fireEvent.change(screen.getByLabelText('Key 2'), { target: { value: 'silt' } });
    fireEvent.change(screen.getByLabelText('Value 2'), { target: { value: '0.2' } });

    await user.click(screen.getByRole('button', { name: /update cell/i }));

    await waitFor(() => {
      expect(updateCell).toHaveBeenCalledWith(
        7,
        expect.objectContaining({
          id: 7,
          name: 'Field A',
          metadata: { sand: 0.4, silt: 0.2 },
        }),
        'test-token',
      );
    });
    expect(refetch).toHaveBeenCalled();
  });

  it('preserves untouched metadata values and keys when saving EditCellModal', async () => {
    const user = userEvent.setup({ delay: null });
    const originalMetadata = {
      empty: null,
      code: '0.4',
      flag: 'true',
      tiny: 1e-7,
      ' leadingKey': 'kept',
    };
    updateCell.mockResolvedValueOnce({ id: 8, name: 'Field B Updated' });

    renderWithProviders(
      <EditCellModal
        cell={{
          id: 8,
          name: 'Field B',
          location: 'East Plot',
          lat: 36.97,
          long: -122.03,
          metadata: originalMetadata,
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /edit/i }));
    fireEvent.change(screen.getByLabelText(/cell name/i), { target: { value: 'Field B Updated' } });
    await user.click(screen.getByRole('button', { name: /update cell/i }));

    await waitFor(() => {
      expect(updateCell).toHaveBeenCalledWith(
        8,
        expect.objectContaining({
          name: 'Field B Updated',
          metadata: originalMetadata,
        }),
        'test-token',
      );
    });
  });

  it('renders cell metadata summary in CellsList and passes it to EditCellModal', async () => {
    const user = userEvent.setup({ delay: null });

    renderWithProviders(<CellsList />);

    expect(await screen.findByText('sand: 0.4, soil: loam')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByLabelText('Key 1')).toHaveValue('sand');
    expect(screen.getByLabelText('Value 1')).toHaveValue('0.4');
  });
});
