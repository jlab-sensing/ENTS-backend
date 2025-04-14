import React from 'react';
import { render, screen } from '@testing-library/react';
// import { waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import AccountInfo from '../pages/profile/components/AccountInfo';
import DeleteCellModal from '../pages/profile/components/DeleteCellModal';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { getCells, deleteCell, getUserCells } from '../services/cell';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
vi.mock('axios');
import CellsList from '../pages/profile/components/CellsList';
import { AuthContext } from '../auth/AuthContextProvider';

// Mock the entire react-router-dom module
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useOutletContext: vi.fn(),
}));

// Mock the service that fetches cells
vi.mock('../services/cell', () => ({
  useUserCells: vi.fn(),
}));

// Partially mock the module (mock only getCells)
// vi.mock('../services/cell', async () => {
//   const actual = await vi.importActual('../services/cell');
//   return {
//     ...actual,
//     getCells: vi.fn().mockResolvedValue([{ id: 1, name: 'Mock Cell' }]),
//   };
// });

// vi.mock("../services/cell", async () => {
//   const actual = await vi.importActual("../services/cell");

//   return {
//     ...actual,
//     getCellData: vi.fn().mockResolvedValue([{ id: 1, name: "Mock Cell Data" }]),
//     getCells: vi.fn().mockResolvedValue([{ id: 1, name: "Mock Cell" }]),
//     addCell: vi.fn().mockResolvedValue({ id: 1, name: "Mock New Cell" }),
//     deleteCell: vi.fn().mockResolvedValue("Mock Cell Deleted"),
//     getUserCells: vi.fn().mockResolvedValue([{ id: 1, name: "Mock User Cell" }]),
//     setCellArchive: vi.fn().mockResolvedValue({ success: true }),
//     pollCellDataResult: vi.fn().mockResolvedValue({ status: "mock_completed" }),
//   };
// });

// vi.mock("../services/cell", async () => {
// //   const actual = await vi.importActual("../services/cell");
// //   return { ...actual, getCells: vi.fn().mockResolvedValue([{ id: 1, name: "Mock Cell" }]) };
// // });

vi.mock('../services/cell', async () => {
  const actual = await vi.importActual('../services/cell');

  return {
    ...actual,
    getCells: vi.fn().mockResolvedValue([{ id: 1, name: 'Mock Cell' }]),
    deleteCell: vi.fn().mockResolvedValue('Mock Cell Deleted'),
    getUserCells: vi.fn().mockResolvedValue([{ id: 1, name: 'Mock User Cell' }]),
  };
});

// Mock the AddCellModal component
vi.mock('../pages/profile/components/AddCellModal', () => ({
  __esModule: true,
  default: () => <div data-testid='add-cell-modal'>AddCellModal</div>,
}));

vi.mock('../pages/profile/components/DeleteCellModal', () => ({
  __esModule: true,
  default: () => <div data-testid='delete-cell-modal'>DeleteCellModal</div>,
}));

vi.mock('../pages/profile/components/CellsList', () => ({
  __esModule: true,
  default: () => <div data-testid='cells-list'>CellsList</div>,
}));

// Create a query client
const queryClient = new QueryClient();

// Mock auth context value
const mockAuthContext = {
  auth: {},
  setAuth: vi.fn(),
  user: null,
  setUser: vi.fn(),
  loggedIn: false,
  setLoggedIn: vi.fn(),
};

// Helper function to render the component within the QueryClientProvider
const renderCellsList = () =>
  render(
    <AuthContext.Provider value={mockAuthContext}>
      <QueryClientProvider client={queryClient}>
        <CellsList />
      </QueryClientProvider>
    </AuthContext.Provider>,
  );

// const renderAccountInfo = () =>
//   render(
//     <AuthContext.Provider value={mockAuthContext}>
//       <QueryClientProvider client={queryClient}>
//         <AccountInfo />
//       </QueryClientProvider>
//     </AuthContext.Provider>,
//   );

const renderDeleteCellModal = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <DeleteCellModal />
    </QueryClientProvider>,
  );

//Test cases

describe('CellsList Component', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // it('renders loading state', () => {
  //   vi.mocked(useOutletContext).mockReturnValue([{ user: { name: 'test-user' } }, vi.fn()]);
  //   vi.mocked(useUserCells).mockReturnValue({ data: null, isLoading: true, isError: false });

  //   renderCellsList();

  //   expect(screen.getByText('Loading...')).toBeInTheDocument();
  // });

  // it('renders error state', () => {
  //   vi.mocked(useOutletContext).mockReturnValue([{ user: { name: 'test-user' } }, vi.fn()]);
  //   vi.mocked(useUserCells).mockReturnValue({ data: null, isLoading: false, isError: true });

  //   renderCellsList();

  //   expect(screen.getByText('Error loading cells.')).toBeInTheDocument();
  // });

  // it('renders DataGrid with cells data', async () => {
  //   vi.mocked(useOutletContext).mockReturnValue([{ user: { name: 'test-user' } }, vi.fn()]);
  //   const mockData = [
  //     {
  //       id: 1,
  //       name: 'Test Cell 1',
  //       location: 'Location 1',
  //       latitude: '12.34',
  //       longitude: '56.78',
  //       archive: false,
  //     },
  //     {
  //       id: 2,
  //       name: 'Test Cell 2',
  //       location: 'Location 2',
  //       latitude: '98.76',
  //       longitude: '54.32',
  //       archive: true,
  //     },
  //   ];

  //   vi.mocked(useUserCells).mockReturnValue({ data: mockData, isLoading: false, isError: false });

  //   renderCellsList();

  //   // Wait for the rows to be rendered
  //   await waitFor(() => expect(screen.getByText('Test Cell 1')).toBeInTheDocument());
  //   await waitFor(() => expect(screen.getByText('Test Cell 2')).toBeInTheDocument());

  //   // Check for columns
  //   expect(screen.getByText('Cell ID')).toBeInTheDocument();
  //   expect(screen.getByText('Name')).toBeInTheDocument();
  //   expect(screen.getByText('Location')).toBeInTheDocument();
  // });

  it('does not render CellsList if no user is present', () => {
    vi.mocked(useOutletContext).mockReturnValue([null, vi.fn()]);
    renderCellsList();

    expect(screen.queryByText('Your Cells')).toBeNull();
  });

  // it('renders CellsList if user is present', () => {
  //   vi.mocked(useOutletContext).mockReturnValue([{ user: { name: 'test-user' } }, vi.fn()]);
  //   renderCellsList();

  //   expect(screen.getByText('Your Cells')).toBeInTheDocument();
  // });

  // it('renders the AddCellModal component', () => {
  //   vi.mocked(useOutletContext).mockReturnValue([{ user: { name: 'test-user' } }, vi.fn()]);
  //   vi.mocked(useUserCells).mockReturnValue({ data: [], isLoading: false, isError: false });

  //   renderCellsList();

  //   // Check if the AddCellModal button is rendered
  //   expect(screen.getByText('AddCellModal')).toBeInTheDocument();
  // });
});

// describe('AccountInfo component', () => {
//   afterEach(() => {
//     vi.clearAllMocks();
//   });

  // it('dosent render when user is null', () => {
  //   vi.mocked(useOutletContext).mockReturnValue([null, vi.fn()]);
  //   renderAccountInfo();

  //   expect(screen.queryByText('Account Info')).toBeNull();
  // });

  // it('renders when user is present', () => {
  //   vi.mocked(useOutletContext).mockReturnValue([{ user: { name: 'test-user' } }, vi.fn()]);
  //   renderAccountInfo();

  //   expect(screen.getByText('Account Info')).toBeInTheDocument();
  // });

  // it('renders email properly', () => {
  //   vi.mocked(useOutletContext).mockReturnValue([{ user: { email: 'test@email.com' } }, vi.fn()]);
  //   renderAccountInfo();

  //   expect(screen.getByText('Email: test@email.com')).toBeInTheDocument();
  // });
  // it('renders name properly', () => {
  //   vi.mocked(useOutletContext).mockReturnValue([{ user: { first_name: 'test', last_name: 'user' } }, vi.fn()]);
  //   renderAccountInfo();

  //   expect(screen.getByText('Name: test user')).toBeInTheDocument();
  // });
// });

describe('DeleteCellModal component', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('doesnt render when user is null', () => {
    vi.mocked(useOutletContext).mockReturnValue([null, vi.fn()]);
    renderDeleteCellModal();

    expect(screen.queryByText('Delete Cell ')).toBeNull();
  });
});

describe('Cell Service API Functions', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // it('adds a new cell successfully', async () => {
  //   const mockResponse = { id: 10, name: 'New Cell' };
  //   axios.post.mockResolvedValue({ data: mockResponse });

  //   const data = await addCell('New Cell', 'Location', '10.0', '20.0', false, 'test@example.com');
  //   expect(data).toEqual(mockResponse);
  //   expect(axios.post).toHaveBeenCalledWith(
  //     `${resource.env.PUBLIC_URL}/api/cell/`,
  //     expect.objectContaining({
  //       name: 'New Cell',
  //       location: 'Location',
  //     })
  //   );
  // });
  it('fetches cells successfully', async () => {
    const mockResponse = [{ id: 1, name: 'Mock Cell' }];
    axios.get.mockResolvedValue({ data: mockResponse });

    const data = await getCells(); // Call actual function
    expect(data).toEqual(mockResponse);
    // expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/api/cells"));q
  });

  // it('fetches cells (mocked)', async () => {
  //   const data = await getCells();
  //   expect(data).toEqual([{ id: 1, name: 'Mock Cell' }]); // Uses partial mock
  //   expect(getCells).toHaveBeenCalledTimes(1);
  // });

  it('delete cell (mocked)', async () => {
    const data = await deleteCell();
    expect(data).toEqual('Mock Cell Deleted'); // Uses partial mock
    expect(deleteCell).toHaveBeenCalledTimes(1);
  });

  it('get User Cells', async () => {
    const data = await getUserCells();
    expect(data).toEqual([{ id: 1, name: 'Mock User Cell' }]); // Uses partial mock
    expect(getUserCells).toHaveBeenCalledTimes(1);
  });

  // it('fetches cell data', async () => {
  //   const mockData = { result: 'Mock Cell Data' };
  //   axios.get.mockResolvedValue({ data: mockData });

  //   const data = await getCellData([1, 2], '1H', new Date(), new Date());
  //   expect(data).toEqual(mockData);
  //   expect(axios.get).toHaveBeenCalled();
  // });
});
