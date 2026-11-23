import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOutletContext } from 'react-router-dom';
import LoggersList from '../pages/profile/components/LoggersList';

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useOutletContext: vi.fn(),
}));

vi.mock('../pages/profile/components/AddLoggerModal', () => ({ default: () => null }));
vi.mock('../pages/profile/components/DeleteLoggerModal', () => ({ default: () => null }));
vi.mock('../pages/profile/components/EditLoggerModal', () => ({ default: () => null }));
vi.mock('../pages/profile/components/ShareButton', () => ({
  default: ({ ids, type }) => <span data-testid='share-button'>{`${type}:${ids.join(',')}`}</span>,
}));

describe('LoggersList', () => {
  beforeEach(() => {
    const context = [];
    context[4] = { id: 1, email: 'owner@example.com' };
    context[6] = [{ id: 7, name: 'shared-logger', type: 'ents', date_created: '2026-11-20T00:00:00' }];
    context[7] = false;
    context[8] = false;
    useOutletContext.mockReturnValue(context);
  });

  it('shares the selected logger', () => {
    render(<LoggersList />);
    expect(screen.getByTestId('share-button')).toHaveTextContent('logger:');

    fireEvent.click(screen.getByText('shared-logger'));

    expect(screen.getByTestId('share-button')).toHaveTextContent('logger:7');
  });
});
