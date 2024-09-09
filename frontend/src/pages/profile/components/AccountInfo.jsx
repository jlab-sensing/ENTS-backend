import { Box, Typography } from '@mui/material';
import useAuth from '../../../auth/hooks/useAuth';

function AccountInfo() {
  const { user } = useAuth();

  if (!user) {
    return <></>;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#A0A0A0',
        width: '30vw',
        height: '100',
        p: 2,
        borderRadius: '10px',
      }}
    >
      <Typography variant='h5' sx={{ textAlign: 'center', color: '#588157', fontWeight: 'bold' }}>
        Account Info
      </Typography>
      <Box
        sx={{
          backgroundColor: 'Gray',
          mb: 1,
          borderRadius: '8px',
          marginTop: '2%',
        }}
      >
        <Typography variant='h6' sx={{ marginLeft: '5%', textalign: 'center' }}>
          Email: {user.email}
        </Typography>
      </Box>
      <Box
        sx={{
          backgroundColor: 'Gray',
          mb: 1,
          borderRadius: '8px',
          marginTop: '2%',
        }}
      >
        <Typography variant='h6' sx={{ marginLeft: '5%', textalign: 'center' }}>
          Name: {user.first_name} {user.last_name}
        </Typography>
      </Box>
    </Box>
  );
}

export default AccountInfo;
