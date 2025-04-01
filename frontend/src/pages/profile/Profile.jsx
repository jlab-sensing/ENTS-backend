import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import useAuth from '../../auth/hooks/useAuth';
import useAxiosPrivate from '../../auth/hooks/useAxiosPrivate';
import Nav from '../../components/Nav';
import { useUserCells } from '../../services/cell';
import SideBar from './components/SideBar';

function Profile() {
  const axiosPrivate = useAxiosPrivate();
  const { user, setUser, loggedIn, setLoggedIn } = useAuth();

  const { data, isLoading, isError, refetch } = useUserCells(axiosPrivate);

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
            paddingLeft: '1vw',
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
          <Outlet context={[data, isLoading, isError, refetch, user, setUser, axiosPrivate]} />
        </Box>
      </Box>
    </Box>
  );
}

export default Profile;
