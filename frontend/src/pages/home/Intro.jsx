import { React } from 'react';
import { Box, Typography } from '@mui/material';
import aboutBg from '../../assets/about-bg.jpg';

function Intro() {
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
        justifyContent: 'space-between',
        backgroundImage: `url(${aboutBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* About PAGE */}
      <Typography variant='h2' component='h1' sx={{ color: '#344E41', textAlign: 'center', my: '20vh' }}>
        Current Projects
      </Typography>
      <p> Hardware to enable large-scale deployment and observation of soil microbial fuel cells</p>
      <a href='https://sensors.soe.ucsc.edu/assets/pdf/ENSsys%202022%20MFC.pptx.pdf'>Learn more -></a>
    </Box>
  );
}

export default Intro;
