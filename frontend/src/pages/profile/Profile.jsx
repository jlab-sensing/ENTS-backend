import { Box, CircularProgress } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuth from '../../auth/hooks/useAuth';
import useAxiosPrivate from '../../auth/hooks/useAxiosPrivate';
import Nav from '../../components/Nav';
import { useUserCells } from '../../services/cell'; import { useUserLoggers } from '../../services/logger'; import SideBar from './components/SideBar';

function Profile() {
  const axiosPrivate = useAxiosPrivate();
  const { user, setUser, loggedIn, setLoggedIn, isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useUserCells(axiosPrivate);
  const { data: loggerData, isLoading: loggerIsLoading, isError: loggerIsError, refetch: loggerRefetch } = useUserLoggers(axiosPrivate);

  // Redirect to home if not logged in after auth check completes
  useEffect(() => {
    if (!isAuthLoading && !loggedIn) {
      navigate('/');
    }
  }, [isAuthLoading, loggedIn, navigate]);

  // Show loading spinner while checking authentication
  if (isAuthLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        scrollSnapAlign: 'center',
        scrollSnapStop: 'always',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
      }}
    >
      <Nav user={user} setUser={setUser} loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          marginTop: '6vh',
        }}
      >
        <Box
          sx={{
            width: { xs: 0, sm: '200px', md: '20vw' },
            paddingLeft: { xs: 0, sm: '1rem', md: '3rem' },
            display: { xs: 'none', sm: 'block' },
          }}
        >
          <SideBar />
        </Box>
        <Box
          sx={{
            flex: 1,
            paddingLeft: { xs: '2vw', sm: '3vw', md: '4vw' },
            paddingRight: { xs: '2vw', sm: '3vw', md: '2vw' },
            overflowY: 'auto',
            width: '100%',
          }}
        >
          <Outlet context={[data, isLoading, isError, refetch, user, setUser, loggerData, loggerIsLoading, loggerIsError, loggerRefetch, axiosPrivate]} />
        </Box>
      </Box>
    </Box>
  );
}

export default Profile;
