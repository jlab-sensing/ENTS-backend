import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Box, Button, IconButton, Menu, MenuItem, Toolbar, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { React, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAxiosPrivate from '../auth/hooks/useAxiosPrivate';
import { logout, signIn } from '../services/auth';
import DvIcon from './DvIcon';

function Nav({ user, setUser, loggedIn, setLoggedIn }) {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const [anchorElNav, setAnchorElNav] = useState(null);
  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const [anchorElProfileMenu, setAnchorElProfileMenu] = useState(null);
  const handleOpenProfileMenu = (event) => {
    setAnchorElProfileMenu(event.currentTarget);
  };
  const handleCloseProfileMenu = () => {
    setAnchorElProfileMenu(null);
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    async function getUserData() {
      try {
        const user = await axiosPrivate
          .get(`${process.env.PUBLIC_URL}/user`, {
            signal: controller.signal,
          })
          .then((res) => res.data);
        if (isMounted && user) {
          setUser(user);
          setLoggedIn(true);
        }
      } catch (err) {
        console.error(err);
      }
    }
    getUserData();

    // Clean up
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [axiosPrivate, setLoggedIn, setUser]);

  return (
    <AppBar position='static' elevation={0} sx={{ bgcolor: 'transparent', pl: '5%', pr: '5%' }}>
      <Toolbar disableGutters>
        <Box
          onClick={() => navigate('/')}
          sx={{
            cursor: 'pointer',
            display: 'flex',
          }}
          aria-label='Go to home page'
        >
          <DvIcon />
        </Box>
        <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
          <IconButton size='large' onClick={handleOpenNavMenu} color='inherit'>
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorElNav}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            open={Boolean(anchorElNav)}
            onClose={handleCloseNavMenu}
            sx={{
              display: { xs: 'block', md: 'none' },
            }}
          >
            <MenuItem key='Home' onClick={() => navigate('/')}>
              <Typography textAlign='center'>Home</Typography>
            </MenuItem>
            <MenuItem key='Dashboard' onClick={() => navigate('/dashboard')}>
              <Typography textAlign='center'>Dashboard</Typography>
            </MenuItem>
            <MenuItem key='Map' onClick={() => navigate('/')}>
              <Typography textAlign='center'>Map</Typography>
            </MenuItem>
            {loggedIn === false ? (
              <MenuItem key='Sign-in' onClick={() => signIn()}>
                <Typography textAlign='center'>Sign In</Typography>
              </MenuItem>
            ) : (
              <MenuItem key='Logout' onClick={() => logout()}>
                <Typography textAlign='center'>Logout</Typography>
              </MenuItem>
            )}
          </Menu>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            display: { xs: 'none', md: 'flex' },
            justifyContent: 'flex-end',
          }}
        >
          <Button key='Home' onClick={() => navigate('/')} sx={{ my: 2, color: 'black', display: 'block' }}>
            Home
          </Button>
          <Button
            key='Dashboard'
            onClick={() => navigate('/dashboard')}
            sx={{ my: 2, color: 'black', display: 'block' }}
          >
            Dashboard
          </Button>
          <Button key='Map' onClick={() => navigate('/map')} sx={{ my: 2, color: 'black', display: 'block' }}>
            Map
          </Button>
          {loggedIn === false ? (
            <Button key='Sign-in' onClick={() => signIn()} sx={{ my: 2, color: 'black', display: 'block' }}>
              Sign in
            </Button>
          ) : (
            <>
              <Button key='profile' onClick={handleOpenProfileMenu} sx={{ my: 2, color: 'black', display: 'block' }}>
                Hi, {user?.first_name}
              </Button>

              <Menu
                id='user-menu'
                anchorEl={anchorElProfileMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                open={Boolean(anchorElProfileMenu)}
                onClose={handleCloseProfileMenu}
                MenuListProps={{
                  'aria-labelledby': 'basic-button',
                }}
              >
                <MenuItem onClick={() => navigate('/profile')}>Profile</MenuItem>
                <MenuItem onClick={() => logout()}>Logout</MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
Nav.propTypes = {
  user: PropTypes.array,
  setUser: PropTypes.func,
  loggedIn: PropTypes.Boolean,
  setLoggedIn: PropTypes.func,
};

export default Nav;
