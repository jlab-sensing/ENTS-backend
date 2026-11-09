import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOutletContext } from 'react-router-dom';
import AddLoggerModal from '../pages/profile/components/AddLoggerModal';

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useOutletContext: vi.fn(),
}));

describe('AddLoggerModal LoRaWAN fields', () => {
  let axiosPrivate;

  beforeEach(() => {
    axiosPrivate = { post: vi.fn().mockResolvedValue({ data: { message: 'ok' } }) };
    const context = [];
    context[4] = { id: 1, email: 'test@example.com' };
    context[9] = vi.fn();
    context[10] = axiosPrivate;
    useOutletContext.mockReturnValue(context);
    render(<AddLoggerModal />);
    fireEvent.click(screen.getByRole('button'));
  });

  it('only asks for the Device EUI', () => {
    expect(screen.getByText('Device EUI')).toBeInTheDocument();
    expect(screen.queryByText('Join EUI')).not.toBeInTheDocument();
    expect(screen.queryByText('App Key')).not.toBeInTheDocument();
  });

  it('registers an EnTS logger with only a Device EUI', async () => {
    const user = userEvent.setup();
    fireEvent.change(screen.getByLabelText(/Logger Name/i), { target: { value: 'my-logger' } });
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(within(screen.getByRole('listbox')).getByText('EnTS'));
    await user.type(screen.getByPlaceholderText('e.g., 0080E1150546D093'), '0080E1150546D093');
    fireEvent.click(screen.getByRole('button', { name: 'Add Logger' }));

    await waitFor(() => expect(axiosPrivate.post).toHaveBeenCalledTimes(1));
    const payload = axiosPrivate.post.mock.calls[0][1];
    expect(payload.dev_eui).toBe('0080E1150546D093');
    expect(payload).not.toHaveProperty('join_eui');
    expect(payload).not.toHaveProperty('app_key');
    expect(screen.queryByText('Create Logger Without LoRaWAN?')).not.toBeInTheDocument();
  });

  it('asks before creating an EnTS logger without a Device EUI', async () => {
    fireEvent.change(screen.getByLabelText(/Logger Name/i), { target: { value: 'my-logger' } });
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(within(screen.getByRole('listbox')).getByText('EnTS'));
    fireEvent.click(screen.getByRole('button', { name: 'Add Logger' }));

    expect(screen.getByText('Create Logger Without LoRaWAN?')).toBeInTheDocument();
    expect(axiosPrivate.post).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(axiosPrivate.post).toHaveBeenCalledTimes(1));
    expect(axiosPrivate.post.mock.calls[0][1]).not.toHaveProperty('dev_eui');
  });
});
