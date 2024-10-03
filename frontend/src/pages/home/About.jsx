import { React } from 'react';
import Nav from '../../components/Nav';
import { Box, Button, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import chart from '../../assets/chart.svg';
import { useNavigate } from 'react-router-dom';
import GitHubIcon from '@mui/icons-material/GitHub';
import useAuth from '../../auth/hooks/useAuth';

function About() {
  const { user, setUser, loggedIn, setLoggedIn } = useAuth();
  const navigate = useNavigate();
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
        backgroundColor: '#DAD7CD',
      }}
    >
      <Nav user={user} setUser={setUser} loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          flexGrow: 1,
          paddingTop: '2.5%',
          paddingRight: '5%',
          paddingLeft: '5%',
        }}
      >
        <Box
          maxWidth='sm'
          sx={{
            display: 'flex',
            flexGrow: '3',
            flexDirection: 'column',
            alignItems: 'start',
            gap: '5%',
          }}
        >
          <Typography variant='h2' component='h1' sx={{ color: '#364F42', fontWeight: 'bold' }}>
            Data Visualization For Outdoor Sensor Networks
          </Typography>
          <Typography variant='h6' component='sub' sx={{ color: '#588157', fontWeight: 'medium' }}>
            DirtViz is part of the Open Sensing Platform&apos;s hardware and software ecosystem for outdoor sensor
            networks. It&apos;s an open source data ingestion and visualization service that parses data from the
            hardware nodes and presents it in an easy-to-use web interface. Users can dynamically generate interactive
            plots, live monitor their sensors, or download data for offline processing.
          </Typography>
          <Box maxWidth='md' sx={{ display: 'flex', flexDirection: 'row', gap: '25px' }}>
            <Button
              key='dashboard'
              onClick={() => navigate('/dashboard')}
              sx={{
                backgroundColor: '#B3C297',
                '&:hover': {
                  backgroundColor: '#A3B18A',
                },
                color: '#364F42',
                pl: '10px',
                pr: '10px',
              }}
            >
              Checkout live data
            </Button>
            <Button
              sx={{ pl: '10px', pr: '10px' }}
              key='map'
              onClick={() => (location.href = 'https://github.com/jlab-sensing/DirtViz')}
            >
              Github Repo &nbsp;
              <GitHubIcon fontSize='small' />
            </Button>
          </Box>
        </Box>
        <Box component='img' sx={{ width: 'auto', pb: '2.5%' }} src={chart}></Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-evenly',
          paddingBottom: '5%',
          justifySelf: 'flex-end',
          alignSelf: 'center',
          alignItems: 'center',
        }}
      >
        <p>Learn more!</p>
        <ExpandMoreIcon></ExpandMoreIcon>
      </Box>
    </Box>
  );
}

export default About;
