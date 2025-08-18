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
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#A0A0A0',
        width: '15vw',
        height: '100',
        p: 2,
        borderRadius: '10px',
      }}
    >
      <MenuList sx={{ flex: 1 }}>
        <Box
          sx={{
            backgroundColor: '#588157',
            mb: 1,
            borderRadius: '8px',
          }}
        >
          <Box
            sx={{
              p: 2,
              borderRadius: '8px',
            }}
          >
            <MenuItem onClick={() => navigate('/profile/cells')} sx={{ color: 'white' }}>
              <ListItemIcon>
                <Box component='img' src={cube} />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: '20px' }}>Cells</ListItemText>
            </MenuItem>
          </Box>
        </Box>
        <Box
          sx={{
            backgroundColor: '#588157',
            mb: 1,
            borderRadius: '8px',
          }}
        >
          <Box
            sx={{
              p: 2,
              borderRadius: '8px',
            }}
          >
            <MenuItem onClick={() => navigate('/profile/loggers')} sx={{ color: 'white' }}>
              <ListItemIcon>
                <Box component='img' src={logger} />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: '20px' }}>Loggers</ListItemText>
            </MenuItem>
          </Box>
        </Box>
        <Box
          sx={{
            backgroundColor: '#588157',
            borderRadius: '8px',
          }}
        >
          <Box
            sx={{
              p: 2,
              borderRadius: '8px',
            }}
          >
            <MenuItem onClick={() => navigate('/profile/account')} sx={{ color: 'white' }}>
              <ListItemIcon>
                <Box component='img' src={user} />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: '20px' }}>Account</ListItemText>
            </MenuItem>
          </Box>
        </Box>
      </MenuList>
    </Box>
  );
}

export default SideBar;
