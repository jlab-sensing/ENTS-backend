import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOutletContext } from 'react-router-dom';
import ShareButton from '../pages/profile/components/ShareButton';
import { shareCell } from '../services/cell';
import { shareLogger } from '../services/logger';

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useOutletContext: vi.fn(),
}));

vi.mock('../auth/hooks/useAuth', () => ({
  default: () => ({ auth: { accessToken: 'token' } }),
}));

vi.mock('../services/cell', () => ({ shareCell: vi.fn() }));
vi.mock('../services/logger', () => ({ shareLogger: vi.fn() }));

describe('ShareButton', () => {
  let cellRefetch;
  let loggerRefetch;

  beforeEach(() => {
    vi.clearAllMocks();
    cellRefetch = vi.fn();
    loggerRefetch = vi.fn();
    const context = [];
    context[3] = cellRefetch;
    context[4] = { id: 1, email: 'owner@example.com' };
    context[9] = loggerRefetch;
    useOutletContext.mockReturnValue(context);
  });

  const shareWith = (email) => {
    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: email } });
    fireEvent.click(screen.getByRole('button', { name: /^Share / }));
  };

  it('shares a logger and refreshes the logger list', async () => {
    shareLogger.mockResolvedValue({ message: 'Logger shared successfully' });
    render(<ShareButton ids={[7]} type='logger' />);

    shareWith('friend@example.com');

    await waitFor(() => expect(screen.getByText('Logger Shared Successfully!')).toBeInTheDocument());
    expect(shareLogger).toHaveBeenCalledWith(7, 'friend@example.com', 'token');
    expect(loggerRefetch).toHaveBeenCalledTimes(1);
    expect(shareCell).not.toHaveBeenCalled();
    expect(cellRefetch).not.toHaveBeenCalled();
  });

  it('labels the popover for loggers', () => {
    render(<ShareButton ids={[7]} type='logger' />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByRole('heading', { name: 'Share Logger' })).toBeInTheDocument();
    expect(screen.getByText('Selected Logger IDs:')).toBeInTheDocument();
  });

  it('shows the error from the server when sharing a logger fails', async () => {
    shareLogger.mockRejectedValue({ response: { data: { message: 'You do not have access to this logger' } } });
    render(<ShareButton ids={[7]} type='logger' />);

    shareWith('friend@example.com');

    await waitFor(() => expect(screen.getByText('You do not have access to this logger')).toBeInTheDocument());
    expect(loggerRefetch).not.toHaveBeenCalled();
  });

  it('falls back to a generic error when the server gives no message', async () => {
    shareLogger.mockRejectedValue(new Error('Network Error'));
    render(<ShareButton ids={[7]} type='logger' />);

    shareWith('friend@example.com');

    await waitFor(() => expect(screen.getByText('Failed to share loggers. Please try again.')).toBeInTheDocument());
  });

  it('still shares cells by default', async () => {
    shareCell.mockResolvedValue({ message: 'Cell shared successfully' });
    render(<ShareButton ids={[3, 4]} />);

    shareWith('friend@example.com');

    await waitFor(() => expect(screen.getByText('Cells Shared Successfully!')).toBeInTheDocument());
    expect(shareCell).toHaveBeenCalledWith(3, 'friend@example.com', 'token');
    expect(shareCell).toHaveBeenCalledWith(4, 'friend@example.com', 'token');
    expect(cellRefetch).toHaveBeenCalledTimes(1);
    expect(shareLogger).not.toHaveBeenCalled();
  });

  it('is disabled when no logger is selected', () => {
    render(<ShareButton ids={[]} type='logger' />);

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
