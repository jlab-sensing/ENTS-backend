import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOutletContext } from 'react-router-dom';
import AddLoggerModal from '../pages/profile/components/AddLoggerModal';

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useOutletContext: vi.fn(),
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
});
