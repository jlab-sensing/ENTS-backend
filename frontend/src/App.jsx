import { React } from 'react';
import { Route, Routes } from 'react-router-dom';
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/profile/Profile';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Map from './pages/map/Map';
import Home from './pages/home/Home';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const queryClient = new QueryClient();

function App() {
  const theme = createTheme({
    typography: {
      fontFamily: 'Nunito Sans, sans-serif',
    },
    components: {
      MuiTypography: {
        defaultProps: {
          variantMapping: {
            h1: 'h1',
            h2: 'h2',
            h3: 'h3',
            h4: 'h4',
            h5: 'h5',
            h6: 'h6',
            subtitle1: 'h2',
            subtitle2: 'h2',
            body1: 'span',
            body2: 'span',
          },
        },
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <div className='App'>
        <ThemeProvider theme={theme}>
          <Routes>
            <Route path='/profile' exact element={<Profile />} />
            <Route path='/dashboard' exact element={<Dashboard />} />
            <Route path='/map' exact element={<Map />} />
            <Route path='/' exact element={<Home />} />
          </Routes>
        </ThemeProvider>
      </div>
    </QueryClientProvider>
  );
}

export default App;
