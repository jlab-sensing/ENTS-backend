import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import useAuth from '../../auth/hooks/useAuth';
import useAxiosPrivate from '../../auth/hooks/useAxiosPrivate';
import Nav from '../../components/Nav';
import { useUserCells } from '../../services/cell';
import { useUserLoggers } from '../../services/logger';
import SideBar from './components/SideBar';

function Profile() {
  const axiosPrivate = useAxiosPrivate();
  const { user, setUser, loggedIn, setLoggedIn } = useAuth();

  const { data, isLoading, isError, refetch } = useUserCells(axiosPrivate);
  const { data: loggerData, isLoading: loggerIsLoading, isError: loggerIsError, refetch: loggerRefetch } = useUserLoggers(axiosPrivate);

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
        backgroundColor: '#DAD7CD',
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
            width: '20vw',
            paddingLeft: '3rem',
          }}
        >
          <SideBar />
        </Box>
        <Box
          sx={{
            flex: 1,
            paddingLeft: '4vw',
            overflowY: 'auto',
          }}
        >
          <Outlet context={[data, isLoading, isError, refetch, user, setUser, loggerData, loggerIsLoading, loggerIsError, loggerRefetch, axiosPrivate]} />
        </Box>
      </Box>
    </Box>
  );
}

export default Profile;
