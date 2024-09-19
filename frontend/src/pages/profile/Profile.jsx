import { Outlet } from 'react-router-dom';
import Nav from '../../components/Nav';
import SideBar from './components/SideBar';
import { Box } from '@mui/material';
import useAuth from '../../auth/hooks/useAuth';
import useAxiosPrivate from '../../auth/hooks/useAxiosPrivate';
function Profile() {
  const axiosPrivate = useAxiosPrivate();
  const user = useAuth();
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        position: 'relative',
        scrollSnapAlign: 'center',
        scrollSnapStop: 'always',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#DAD7CD',
      }}
    >
      <Nav />
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
          <Outlet context={[user, axiosPrivate]} />
        </Box>
      </Box>
    </Box>
  );
}

export default Profile;
