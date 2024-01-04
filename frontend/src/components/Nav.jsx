import { React, useState, useContext } from 'react';
import { AppBar, Button, Container, IconButton, Toolbar, Box, Typography, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DvIcon from './DvIcon';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContextProvider';
import { signIn } from '../services/auth';

function Nav() {
  const { loggedIn, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [anchorElNav, setAnchorElNav] = useState(null);
  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };
  console.log(loggedIn, user);

  return (
    <AppBar position='static' elevation={0} sx={{ bgcolor: 'transparent', pl: '5%', pr: '5%' }}>
      <Container disableGutters={true} maxWidth='xl'>
        <Toolbar disableGutters>
          <DvIcon />
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
                <MenuItem key='Name'>
                  <Typography textAlign='center'>Hi, {user?.email}</Typography>
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
              <Button key='Sign-in' onClick={() => {}} sx={{ my: 2, color: 'black', display: 'block' }}>
                Hi, {user?.email}
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Nav;
