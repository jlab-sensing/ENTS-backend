import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Box, Button, Divider, Drawer, IconButton, List, ListItemButton, ListItemText, Menu, MenuItem, Toolbar, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { React, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../auth/hooks/useAuth';
import useAxiosPrivate from '../auth/hooks/useAxiosPrivate';
import { logout, signIn } from '../services/auth';
import DvIcon from './DvIcon';

function Nav({ user, setUser, loggedIn, setLoggedIn }) {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const { isAuthLoading, setIsAuthLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const openDrawer = () => setMobileOpen(true);
  const closeDrawer = () => setMobileOpen(false);

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
        // If user fetch fails, clear auth state
        if (isMounted) {
          setLoggedIn(false);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    }
    getUserData();

    // Clean up
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [axiosPrivate, setLoggedIn, setUser, setIsAuthLoading]);

  const location = useLocation();
  const isActive = useMemo(() => ({
    home: location.pathname === '/',
    dashboard: location.pathname.startsWith('/dashboard'),
    map: location.pathname.startsWith('/map'),
    docs: location.pathname.startsWith('/docs'),
  }), [location.pathname]);

  return (
    <AppBar position='sticky' elevation={0} sx={{ bgcolor: '#FFFFFF', borderBottom: { xs: '1px solid #E5E7EB', md: 'none' }, px: { xs: '4%', md: '6%' }, pt: 1 }}>
      <Toolbar disableGutters sx={{ alignItems: 'center' }}>
        <Box
          onClick={() => navigate('/')}
          sx={{ cursor: 'pointer', display: 'flex' }}
          aria-label='Go to home page'
        >
          <DvIcon />
        </Box>

        {/* Mobile menu */}
        <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' }, justifyContent: 'flex-end' }}>
          <IconButton size='large' onClick={openDrawer} aria-label='Open menu' color='default'>
            <MenuIcon />
          </IconButton>
          <Drawer anchor='right' open={mobileOpen} onClose={closeDrawer} PaperProps={{ sx: { width: 280 } }}>
            <Box sx={{ p: 2 }}>
              <Typography variant='subtitle2' sx={{ fontWeight: 800, color: '#111827' }}>Menu</Typography>
            </Box>
            <Divider />
            <List>
              <ListItemButton onClick={() => { navigate('/'); closeDrawer(); }}>
                <ListItemText primary='Home' />
              </ListItemButton>
              <ListItemButton onClick={() => { navigate('/dashboard'); closeDrawer(); }}>
                <ListItemText primary='Dashboard' />
              </ListItemButton>
              <ListItemButton onClick={() => { navigate('/map'); closeDrawer(); }}>
                <ListItemText primary='Map' />
              </ListItemButton>
              <ListItemButton onClick={() => { navigate('/docs'); closeDrawer(); }}>
                <ListItemText primary='Docs' />
              </ListItemButton>
            </List>
            <Divider />
            <Box sx={{ p: 2 }}>
              {loggedIn === false ? (
                <Button fullWidth onClick={() => { signIn(); closeDrawer(); }} sx={{ textTransform: 'none', borderRadius: '8px', px: 2, py: 1, fontWeight: 700, backgroundColor: '#111827', color: '#FFFFFF', '&:hover': { backgroundColor: '#0B1220' } }}>
                  Sign in
                </Button>
              ) : (
                <Button fullWidth onClick={() => { logout(); closeDrawer(); }} sx={{ textTransform: 'none', borderRadius: '8px', px: 2, py: 1, fontWeight: 700, color: '#111827' }}>
                  Logout
                </Button>
              )}
            </Box>
          </Drawer>
        </Box>

        {/* Center pill nav - keep original menu items */}
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            background: 'rgba(255,255,255,0.72)',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: '999px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            px: 0.75,
            py: 0.5,
            backdropFilter: 'blur(8px)'
          }}>
            <Button onClick={() => navigate('/')} sx={{
              textTransform: 'none',
              borderRadius: '999px',
              px: 1.75,
              py: 0.5,
              fontWeight: 700,
              color: isActive.home ? '#FFFFFF' : '#0F172A',
              backgroundColor: isActive.home ? '#0F172A' : 'transparent',
              '&:hover': { backgroundColor: isActive.home ? '#111827' : 'rgba(0,0,0,0.04)' }
            }}>Home</Button>
            <Button onClick={() => navigate('/dashboard')} sx={{
              textTransform: 'none', borderRadius: '999px', px: 1.75, py: 0.5, fontWeight: 700,
              color: isActive.dashboard ? '#FFFFFF' : '#0F172A',
              backgroundColor: isActive.dashboard ? '#0F172A' : 'transparent',
              '&:hover': { backgroundColor: isActive.dashboard ? '#111827' : 'rgba(0,0,0,0.04)' }
            }}>Dashboard</Button>
            <Button onClick={() => navigate('/map')} sx={{
              textTransform: 'none', borderRadius: '999px', px: 1.75, py: 0.5, fontWeight: 700,
              color: isActive.map ? '#FFFFFF' : '#0F172A',
              backgroundColor: isActive.map ? '#0F172A' : 'transparent',
              '&:hover': { backgroundColor: isActive.map ? '#111827' : 'rgba(0,0,0,0.04)' }
            }}>Map</Button>
            <Button onClick={() => navigate('/docs')} sx={{
              textTransform: 'none', borderRadius: '999px', px: 1.75, py: 0.5, fontWeight: 700,
              color: isActive.docs ? '#FFFFFF' : '#0F172A',
              backgroundColor: isActive.docs ? '#0F172A' : 'transparent',
              '&:hover': { backgroundColor: isActive.docs ? '#111827' : 'rgba(0,0,0,0.04)' }
            }}>Docs</Button>
          </Box>
        </Box>

        {/* Right sign-in/profile */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
          {loggedIn === false ? (
            <Button key='Sign-in' onClick={() => signIn()} sx={{ textTransform: 'none', borderRadius: '999px', px: 2, py: 0.75, fontWeight: 700, color: '#0F172A' }}>
              Sign in
            </Button>
          ) : (
            <>
              <Button key='profile' onClick={handleOpenProfileMenu} sx={{ textTransform: 'none', color: '#0F172A' }}>
                Hi, {user?.first_name}
              </Button>
              <Menu id='user-menu' anchorEl={anchorElProfileMenu} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} keepMounted transformOrigin={{ vertical: 'top', horizontal: 'left' }} open={Boolean(anchorElProfileMenu)} onClose={handleCloseProfileMenu}>
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
  user: PropTypes.object,
  setUser: PropTypes.func,
  loggedIn: PropTypes.bool,
  setLoggedIn: PropTypes.func,
};

export default Nav;
