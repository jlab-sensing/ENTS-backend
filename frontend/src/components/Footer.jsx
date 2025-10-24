import EmailIcon from '@mui/icons-material/Email';
import GitHubIcon from '@mui/icons-material/GitHub';
import { Box, Link, Typography } from '@mui/material';
import { React } from 'react';
import DvIcon from './DvIcon';

function Footer() {
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        height: '8vh',
        width: '90%',
        color: '#588157',
        display: 'flex',
        justifyContent: 'space-between',
        pl: '5%',
        pr: '5%',
        pb: '1.5%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <DvIcon color="#588157" />
        <Typography variant='body2'>
          Made by jLab. Check out our website at{' '}
          <Link href='https://sensors.soe.ucsc.edu/' sx={{ color: '#588157' }} underline='hover'>
            sensors.soe.ucsc.edu
          </Link>
        </Typography>

        <Box sx={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link
            href='/contact/'
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#588157',
            }}
            underline='hover'
          >
            <EmailIcon fontSize='small' />
            <Typography variant='body2'>Contact Us</Typography>
          </Link>

          <Link
            href='https://github.com/jlab-sensing/DirtViz'
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#588157',
            }}
            underline='hover'
          >
            <GitHubIcon fontSize='small' />
            <Typography variant='body2'>GitHub Repo</Typography>
          </Link>
        </Box>
      </Box>
    </Box>
  );
}

export default Footer;
