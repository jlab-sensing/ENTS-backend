import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOutletContext } from 'react-router-dom';
import AddCellModal from '../pages/profile/components/AddCellModal';
import { addCell } from '../services/cell';

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useOutletContext: vi.fn(),
}));

vi.mock('../services/cell', () => ({
  addCell: vi.fn(),
}));

vi.mock('../services/tag', () => ({
  useAssignCellTags: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('../components/TagSelector', () => ({
  default: () => null,
}));

describe('AddCellModal success screen endpoints', () => {
  beforeEach(() => {
    addCell.mockResolvedValue({ id: 42, name: 'Test Cell' });
    useOutletContext.mockReturnValue([
      [],
      false,
      false,
      vi.fn(),
      { id: 1, email: 'test@example.com' },
      vi.fn(),
      { post: vi.fn() },
    ]);
  });

  it('shows the sensor upload endpoint without a sensor id for both Power and TEROS', async () => {
    render(<AddCellModal />);

    fireEvent.click(screen.getByRole('button'));

    fireEvent.change(screen.getByLabelText(/Cell Name/i), { target: { value: 'Test Cell' } });
    fireEvent.change(screen.getByLabelText(/Location/i), { target: { value: 'North Field' } });
    fireEvent.change(screen.getByLabelText(/Latitude/i), { target: { value: '36.9741' } });
    fireEvent.change(screen.getByLabelText(/Longitude/i), { target: { value: '-122.0308' } });

    fireEvent.click(screen.getByRole('button', { name: 'Add Cell' }));

    await waitFor(() => expect(screen.getByText('Cell Created Successfully!')).toBeInTheDocument());

    expect(screen.getByText('Power Data')).toBeInTheDocument();
    expect(screen.getByText('TEROS Data')).toBeInTheDocument();

    const endpoints = Array.from(document.querySelectorAll('p'))
      .map((el) => el.textContent.trim())
      .filter((t) => t.includes('dirtviz.jlab.ucsc.edu/api/sensor'));
    expect(endpoints).toHaveLength(2);

    endpoints.forEach((url) => {
      expect(url).toMatch(/\/api\/sensor\/$/);
      expect(url).not.toMatch(/\/api\/sensor\/\d/);
    });

    const text = document.body.textContent;
    expect(text).not.toMatch(/api\/power\//);
    expect(text).not.toMatch(/api\/teros\//);
  });
});
