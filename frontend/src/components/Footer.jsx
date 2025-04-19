import { React } from 'react';
import { Box, Typography } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';

function Footer() {
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: '0',
        height: '5vh',
        width: '90%',
        textAlign: 'center',
        color: '#588157',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        pl: '5%',
        pr: '5%',
        pb: '1.5%',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '2.5px' }}>
        <Box>
          made by jLab, check out our website at&nbsp;
          <Box component={'a'} sx={{ color: '#588157' }} href='https://sensors.soe.ucsc.edu/'>
            sensors.soe.ucsc.edu
          </Box>
        </Box>
        <Box component={'a'} sx={{ color: '#588157', ml:1.5 }} href='/contact/'>
          contact us
        </Box>
        <Box
          component={'a'}
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: '3px',
            color: '#588157',
            alignSelf: 'center',
            alignContent: 'center',
          }}
          href='https://github.com/jlab-sensing/DirtViz'
        >
          <GitHubIcon sx={{ alignSelf: 'center' }} fontSize='medium' />
          <Typography>Github Repo</Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default Footer;
