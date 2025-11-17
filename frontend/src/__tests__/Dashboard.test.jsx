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

import React from 'react';
import { render, screen, within } from '@testing-library/react'; // Import 'within'
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
  it('should load cell select as unselected', async () => {
    render(<MockCellSelect selectedCells={[]} setSelectedCells={mockedSetSelectedCells} />);
    const cellSelectElement = await screen.findByLabelText('Cell');
    expect(cellSelectElement).toBeInTheDocument();
  });

  it('should load copy link button', async () => {
    render(<CopyLinkBtn startDate={DateTimeNow} endDate={DateTimeNow} selectedCells={[]} />);
    const copyLinkButton = await screen.findByLabelText('Copy Link');
    expect(copyLinkButton).toBeInTheDocument();
  });

  it('should display mocked cell names when dropdown is open', async () => {
    const user = userEvent.setup();
    render(<MockCellSelect selectedCells={[]} setSelectedCells={mockedSetSelectedCells} />);
    
    // 1. Find the input field by its role and click it to open the dropdown
    const input = screen.getByRole('combobox', { name: 'Cell' });
    await user.click(input);
    
    // 2. Wait for the listbox (the dropdown menu) to appear in the document
    const listbox = await screen.findByRole('listbox');
    
    // 3. Use `within` to scope the search for the options only inside the listbox
    const option1 = await within(listbox).findByText('test_cell_1');
    const option2 = await within(listbox).findByText('test_cell_2');
    
    // 4. Assert that the options were found within the listbox
    expect(option1).toBeInTheDocument();
    expect(option2).toBeInTheDocument();
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
