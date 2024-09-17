import { Box, Typography } from '@mui/material';
function SensorItem(device) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'Gray',
        width: '30vw',
        height: '100',
        p: 2,
        borderRadius: '10px',
      }}
    >
      <Typography variant='h5' sx={{ textAlign: 'center', color: '#588157', fontWeight: 'bold' }}>
        {device.name}
      </Typography>
      <Typography variant='h6' sx={{ textAlign: 'center', color: '#588157', fontWeight: 'bold' }}>
        API Key: {device.api_key}
      </Typography>
    </Box>
  );
}

export default SensorItem;
