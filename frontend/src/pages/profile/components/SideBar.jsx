import { MenuItem, MenuList, ListItemIcon, ListItemText, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import cube from '../../../assets/box.svg';
import logger from '../../../assets/logger.svg';
import user from '../../../assets/user.svg';

function SideBar() {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        position: 'sticky',
        top: '2rem',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#A0A0A0',
        width: '16rem',
        minHeight: 'fit-content',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      <MenuList 
        sx={{ 
          padding: '1rem',
          gap: '0.75rem',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <MenuItem 
          onClick={() => navigate('/profile/cells')} 
          sx={{
            backgroundColor: '#588157',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            color: 'white',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#4a6f4a',
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: '2.5rem' }}>
            <Box 
              component='img' 
              src={cube} 
              sx={{ 
                width: '1.5rem', 
                height: '1.5rem',
                filter: 'brightness(0) invert(1)'
              }} 
            />
          </ListItemIcon>
          <ListItemText 
            primary="Cells"
            primaryTypographyProps={{ 
              fontSize: '1rem',
              fontWeight: 500,
              letterSpacing: '0.025em'
            }}
          />
        </MenuItem>

        <MenuItem 
          onClick={() => navigate('/profile/loggers')} 
          sx={{
            backgroundColor: '#588157',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            color: 'white',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#4a6f4a',
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: '2.5rem' }}>
            <Box 
              component='img' 
              src={logger} 
              sx={{ 
                width: '1.5rem', 
                height: '1.5rem',
                filter: 'brightness(0) invert(1)'
              }} 
            />
          </ListItemIcon>
          <ListItemText 
            primary="Loggers"
            primaryTypographyProps={{ 
              fontSize: '1rem',
              fontWeight: 500,
              letterSpacing: '0.025em'
            }}
          />
        </MenuItem>

        <MenuItem 
          onClick={() => navigate('/profile/account')} 
          sx={{
            backgroundColor: '#588157',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            color: 'white',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#4a6f4a',
              transform: 'translateY(-1px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: '2.5rem' }}>
            <Box 
              component='img' 
              src={user} 
              sx={{ 
                width: '1.5rem', 
                height: '1.5rem',
                filter: 'brightness(0) invert(1)'
              }} 
            />
          </ListItemIcon>
          <ListItemText 
            primary="Account"
            primaryTypographyProps={{ 
              fontSize: '1rem',
              fontWeight: 500,
              letterSpacing: '0.025em'
            }}
          />
        </MenuItem>
      </MenuList>
    </Box>
  );
}

export default SideBar;
