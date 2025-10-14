import { React } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/profile/Profile';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Map from './pages/map/Map';
import Contact from './pages/contact/Contact';
import Home from './pages/home/Home';
import Callback from './auth/Callback';
import AuthContextProvider from './auth/AuthContextProvider';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AccountInfo from './pages/profile/components/AccountInfo';
import CellsList from './pages/profile/components/CellsList';
import LoggersList from './pages/profile/components/LoggersList';

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
        <AuthContextProvider>
          <ThemeProvider theme={theme}>
            <Routes>
              <Route path='/auth/callback' exact element={<Callback />} />
              <Route path='/profile' exact element={<Navigate replace to='/profile/cells' />} />
              <Route path='/profile' exact element={<Profile />}>
                <Route path='account' element={<AccountInfo />} />
                <Route path='cells' element={<CellsList />} />
                <Route path='loggers' element={<LoggersList />} />
              </Route>
              <Route path='/dashboard' exact element={<Dashboard />} />
              <Route path='/map' exact element={<Map />} />
              <Route path='/contact' exact element={<Contact />} />
              <Route path='/' exact element={<Home />} />
              <Route path='*' element={<Navigate replace to='/' />} />
            </Routes>
          </ThemeProvider>
        </AuthContextProvider>
      </div>
    </QueryClientProvider>
  );
}

export default App;
