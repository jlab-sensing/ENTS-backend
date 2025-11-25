import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock the cell service before importing components that use it
vi.mock('../services/cell', () => ({
  useCells: () => ({
    data: [
      { id: '1', name: 'test_cell_1', archive: false },
      { id: '2', name: 'test_cell_2', archive: false },
    ],
    isLoading: false,
    isError: false,
  }),
}));

// Mock the tag service
vi.mock('../services/tag', () => ({
  useTags: () => ({
    data: [
      { id: 'tag1', name: 'Test Tag 1' },
      { id: 'tag2', name: 'Test Tag 2' },
    ],
    isLoading: false,
    isError: false,
  }),
  getCellsByTag: vi.fn(() => Promise.resolve({ cells: [] })),
}));

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CellSelect from '../pages/dashboard/components/CellSelect';
import CopyLinkBtn from '../pages/dashboard/components/CopyLinkBtn';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';

// Clean up mocks after each test
afterEach(() => {
  vi.restoreAllMocks();
});

const queryClient = new QueryClient();
const mockedSetSelectedCells = vi.fn();
const DateTimeNow = DateTime.now();

const MockCellSelect = ({ selectedCells, setSelectedCells }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <CellSelect selectedCells={selectedCells} setSelectedCells={setSelectedCells} />
    </QueryClientProvider>
  );
};

MockCellSelect.propTypes = {
  selectedCells: PropTypes.array,
  setSelectedCells: PropTypes.func,
};

describe('Loading dashboard', () => {
  it('should load cell select dropdown', async () => {
    render(<MockCellSelect selectedCells={[]} setSelectedCells={mockedSetSelectedCells} />);
    const cellSelectElement = await screen.findByLabelText('Cell');
    expect(cellSelectElement).toBeInTheDocument();
  });

  it('should show tag filter inside dropdown when opened', async () => {
    const user = userEvent.setup();
    render(<MockCellSelect selectedCells={[]} setSelectedCells={mockedSetSelectedCells} />);
    
    // Open the dropdown
    const cellSelect = screen.getByLabelText('Cell');
    await user.click(cellSelect);
    
    // Check for "Filter by Tags" text inside the dropdown
    const tagFilterLabel = await screen.findByText('Filter by Tags');
    expect(tagFilterLabel).toBeInTheDocument();
  });

  it('should show search box inside dropdown when opened', async () => {
    const user = userEvent.setup();
    render(<MockCellSelect selectedCells={[]} setSelectedCells={mockedSetSelectedCells} />);
    
    // Open the dropdown
    const cellSelect = screen.getByLabelText('Cell');
    await user.click(cellSelect);
    
    // Check for "Search by Cell" text inside the dropdown
    const searchLabel = await screen.findByText('Search by Cell');
    expect(searchLabel).toBeInTheDocument();
  });

  it('should load copy link button', async () => {
    render(<CopyLinkBtn startDate={DateTimeNow} endDate={DateTimeNow} selectedCells={[]} />);
    const copyLinkButton = await screen.findByLabelText('Copy Link');
    expect(copyLinkButton).toBeInTheDocument();
  });

  it('should filter and display options when a user types in search bar', async () => {
    const user = userEvent.setup();
    render(<MockCellSelect selectedCells={[]} setSelectedCells={mockedSetSelectedCells} />);

    // Open the dropdown
    const cellSelect = screen.getByLabelText('Cell');
    await user.click(cellSelect);

    // Find the search input inside the dropdown
    const searchInput = await screen.findByPlaceholderText('Type to search by name or ID...');
    
    // Type in the search box
    await user.type(searchInput, 'test_cell_1');

    // The option should be visible
    const option1 = await screen.findByText('test_cell_1');
    expect(option1).toBeInTheDocument();
  });

  it('should display selected cell count in dropdown footer', async () => {
    const selectedCells = [
      { id: '1', name: 'test_cell_1', archive: false },
      { id: '2', name: 'test_cell_2', archive: false },
    ];
    const user = userEvent.setup();
    render(<MockCellSelect selectedCells={selectedCells} setSelectedCells={mockedSetSelectedCells} />);

    // Open the dropdown
    const cellSelect = screen.getByLabelText('Cell');
    await user.click(cellSelect);

    // Check that the "X cells selected" text appears in the footer
    const selectedText = await screen.findByText('2 cells selected');
    expect(selectedText).toBeInTheDocument();
  });

  it('should display comma-separated cell names in closed dropdown', async () => {
    const selectedCells = [
      { id: '1', name: 'test_cell_1', archive: false },
      { id: '2', name: 'test_cell_2', archive: false },
    ];
    render(<MockCellSelect selectedCells={selectedCells} setSelectedCells={mockedSetSelectedCells} />);

    // For MUI Select, the display text is rendered separately from the input value
    // We need to check the visible text content, not the input's value attribute
    const formControl = screen.getByLabelText('Cell').closest('.MuiFormControl-root');
    
    // The comma-separated text should be visible in the Select's display area
    await waitFor(() => {
      expect(screen.getByText('test_cell_1, test_cell_2')).toBeInTheDocument();
    });
  });
});

describe('Testing copy functionality', () => {
  it('should copy a URL with the correct cellID QueryParam of 1,2', async () => {
    const writeTextMock = vi.fn();
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeTextMock);

    const user = userEvent.setup();
    const selectedCells = [{ id: 1 }, { id: 2 }];
    render(<CopyLinkBtn startDate={DateTimeNow} endDate={DateTimeNow} selectedCells={selectedCells} />);
    const copyLinkButton = screen.getByLabelText('Copy Link');
    await user.click(copyLinkButton);
    const copiedText = `http://localhost:3000/dashboard?cell_id=${selectedCells
      .map((cell) => cell.id)
      .join(',')}&startDate=${DateTimeNow}&endDate=${DateTimeNow}`;

    expect(writeTextMock).toHaveBeenCalledWith(copiedText);
  });

  it('should copy a URL with the correct cellID QueryParam of 12', async () => {
    const writeTextMock = vi.fn();
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeTextMock);

    const user = userEvent.setup();
    const selectedCells = [{ id: 12 }];
    render(<CopyLinkBtn startDate={DateTimeNow} endDate={DateTimeNow} selectedCells={selectedCells} />);
    const copyLinkButton = screen.getByLabelText('Copy Link');
    await user.click(copyLinkButton);
    const copiedText = `http://localhost:3000/dashboard?cell_id=${selectedCells
      .map((cell) => cell.id)
      .join(',')}&startDate=${DateTimeNow}&endDate=${DateTimeNow}`;

    expect(writeTextMock).toHaveBeenCalledWith(copiedText);
  });

  it('should copy a URL with the correct startDate QueryParam', async () => {
    const writeTextMock = vi.fn();
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeTextMock);
    const startDate = DateTime.now().minus({ days: 14 });

    const user = userEvent.setup();
    render(<CopyLinkBtn startDate={startDate} endDate={DateTimeNow} selectedCells={[]} />);
    const copyLinkButton = screen.getByLabelText('Copy Link');
    await user.click(copyLinkButton);
    const copiedText = `http://localhost:3000/dashboard?cell_id=&startDate=${startDate}&endDate=${DateTimeNow}`;

    expect(writeTextMock).toHaveBeenCalledWith(copiedText);
  });

  it('should copy a URL with the correct endDate QueryParam', async () => {
    const writeTextMock = vi.fn();
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeTextMock);
    const endDate = DateTime.now().minus({ days: 14 });

    const user = userEvent.setup();
    render(<CopyLinkBtn startDate={DateTimeNow} endDate={endDate} selectedCells={[]} />);
    const copyLinkButton = screen.getByLabelText('Copy Link');
    await user.click(copyLinkButton);
    const copiedText = `http://localhost:3000/dashboard?cell_id=&startDate=${DateTimeNow}&endDate=${endDate}`;
    expect(writeTextMock).toHaveBeenCalledWith(copiedText);
  });
});
