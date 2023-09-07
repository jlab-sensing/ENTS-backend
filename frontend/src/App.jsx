import { React } from 'react';
import Dashboard from './pages/dashboard/Dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className='App'>
        <Dashboard />
      </div>
    </QueryClientProvider>
  );
}

export default App;
