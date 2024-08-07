import { React } from 'react';
import { Box } from '@mui/material';

function Contact() {
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        position: 'relative',
        scrollSnapAlign: 'center',
        display: 'flex',
        scrollSnapStop: 'always',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#DAD7CD',
      }}
    >
      {/* CONTACTUS PAGE */}
      <p>Check out our website at jlab.ucsc.edu</p>
      <footer>jLab in Smart Sensing</footer>
    </Box>
  );
}

export default Contact;
