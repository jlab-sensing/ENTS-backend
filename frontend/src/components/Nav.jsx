import { React, useState } from 'react';
import { AppBar, Button, Container, IconButton, Toolbar, Box, Typography, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DvIcon from './DvIcon';
import { useNavigate } from 'react-router-dom';

function Nav() {
  const navigate = useNavigate();
  const [anchorElNav, setAnchorElNav] = useState(null);
  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

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
            <Button key='map' onClick={() => navigate('/map')} sx={{ my: 2, color: 'black', display: 'block' }}>
              Map
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Nav;
