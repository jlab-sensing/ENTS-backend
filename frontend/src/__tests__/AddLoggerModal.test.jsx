import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOutletContext } from 'react-router-dom';
import AddLoggerModal from '../pages/profile/components/AddLoggerModal';
import { addLogger } from '../services/logger';

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useOutletContext: vi.fn(),
}));

vi.mock('../services/logger', () => ({
  addLogger: vi.fn(),
}));

const openModal = () => {
  render(<AddLoggerModal />);
  fireEvent.click(screen.getByRole('button', { name: 'add logger' }));
  return screen.getByLabelText(/Logger Name/i);
};

describe('AddLoggerModal logger name validation', () => {
  beforeEach(() => {
    useOutletContext.mockReturnValue([
      [],
      false,
      false,
      vi.fn(),
      { id: 1, email: 'test@example.com' },
      vi.fn(),
      [],
      false,
      false,
      vi.fn(),
      { post: vi.fn() },
    ]);
  });

  it('does not show the name as an error when the modal first opens', () => {
    const nameInput = openModal();
    expect(nameInput).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByText('Logger name is required')).not.toBeInTheDocument();
  });

  it('shows the error after the user leaves the name field empty', () => {
    const nameInput = openModal();
    fireEvent.blur(nameInput);
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Logger name is required')).toBeInTheDocument();
  });

  it('clears the error once a name is entered', () => {
    const nameInput = openModal();
    fireEvent.blur(nameInput);
    fireEvent.change(nameInput, { target: { value: 'my-logger' } });
    expect(nameInput).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByText('Logger name is required')).not.toBeInTheDocument();
  });

  it('does not keep the error after the modal is closed and reopened', () => {
    fireEvent.blur(openModal());
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    fireEvent.click(screen.getByRole('button', { name: 'add logger' }));
    const nameInput = screen.getByLabelText(/Logger Name/i);
    expect(nameInput).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByText('Logger name is required')).not.toBeInTheDocument();
  });

  it('does not keep the error after a logger is added and the modal is reopened', async () => {
    addLogger.mockResolvedValue({});
    const nameInput = openModal();
    fireEvent.blur(nameInput);
    fireEvent.change(nameInput, { target: { value: 'my-logger' } });
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(within(screen.getByRole('listbox')).getByText('Other'));
    fireEvent.click(screen.getByRole('button', { name: 'Add Logger' }));
    fireEvent.click(await screen.findByRole('button', { name: /done/i }));
    fireEvent.click(screen.getByRole('button', { name: 'add logger' }));
    expect(screen.getByLabelText(/Logger Name/i)).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByText('Logger name is required')).not.toBeInTheDocument();
  });
});
