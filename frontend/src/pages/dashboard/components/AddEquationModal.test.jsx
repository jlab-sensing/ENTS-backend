import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AddEquationModal from './AddEquationModal';

vi.mock('../../../services/equation', () => ({
  validateEquationOnServer: vi.fn(),
}));

import { validateEquationOnServer } from '../../../services/equation';

describe('AddEquationModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows client validation error for bare stream names', async () => {
    const user = userEvent.setup();

    render(
      <AddEquationModal
        open
        onClose={vi.fn()}
        onSave={vi.fn()}
        selectedCells={[{ id: 1, name: 'Cell-001' }]}
      />,
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'vwc / temp');
    await user.click(screen.getByRole('button', { name: 'Add equation' }));

    expect(await screen.findByText(/cell:stream/i)).toBeInTheDocument();
    expect(validateEquationOnServer).not.toHaveBeenCalled();
  });

  it('validates on server and saves a valid expression', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();

    validateEquationOnServer.mockResolvedValue({ ok: true, refs: ['1:vwc', '1:temp'] });

    render(
      <AddEquationModal
        open
        onClose={onClose}
        onSave={onSave}
        selectedCells={[{ id: 1, name: 'Cell-001' }]}
      />,
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '1:vwc / 1:temp');
    await user.click(screen.getByRole('button', { name: 'Add equation' }));

    await waitFor(() => {
      expect(validateEquationOnServer).toHaveBeenCalledWith('1:vwc / 1:temp', [1]);
    });
    expect(onSave).toHaveBeenCalledWith('1:vwc / 1:temp');
    expect(onClose).toHaveBeenCalled();
  });

  it('shows server validation errors', async () => {
    const user = userEvent.setup();

    validateEquationOnServer.mockResolvedValue({
      error: 'Reference 2:vwc uses cell 2 which is not selected',
    });

    render(
      <AddEquationModal
        open
        onClose={vi.fn()}
        onSave={vi.fn()}
        selectedCells={[{ id: 1, name: 'Cell-001' }]}
      />,
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '2:vwc / 2:temp');
    await user.click(screen.getByRole('button', { name: 'Add equation' }));

    expect(await screen.findByText(/not selected/i)).toBeInTheDocument();
  });

  it('inserts example expressions into the field', async () => {
    const user = userEvent.setup();

    render(
      <AddEquationModal
        open
        onClose={vi.fn()}
        onSave={vi.fn()}
        selectedCells={[{ id: 2, name: 'Cell-002' }]}
      />,
    );

    await user.click(screen.getByText('2:vwc / 2:temp'));
    expect(screen.getByRole('textbox')).toHaveValue('2:vwc / 2:temp');
  });
});
