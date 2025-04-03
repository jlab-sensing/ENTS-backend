import { render, screen } from '@testing-library/react';
// import { waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AccountInfo from '../pages/profile/components/AccountInfo';
import CellsList from '../pages/profile/components/CellsList';
// import { useUserCells } from '../services/cell';
import { useOutletContext } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

// Mock the AddCellModal component
vi.mock('../pages/profile/components/AddCellModal', () => ({
  __esModule: true,
  default: () => <div data-testid='add-cell-modal'>AddCellModal</div>,
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

const renderAccountInfo = () =>
  render(
    <AuthContext.Provider value={mockAuthContext}>
      <QueryClientProvider client={queryClient}>
        <AccountInfo />
      </QueryClientProvider>
    </AuthContext.Provider>,
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

describe('AccountInfo component', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('dosent render when user is null', () => {
    vi.mocked(useOutletContext).mockReturnValue([null, vi.fn()]);
    renderAccountInfo();

    expect(screen.queryByText('Account Info')).toBeNull();
  });

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
});
