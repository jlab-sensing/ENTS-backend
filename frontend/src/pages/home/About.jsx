import { React, useEffect, useRef, useState } from 'react';
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
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  const contextMenuRef = useRef(null);

  const githubRightClick = (event) => {
    event.preventDefault(); // prevents reloading a page and showing the default settings
    setContextMenuPosition({ x: event.clientX, y: event.clientY }); // gets the coordinates of where the user has clicked the button. Easier to format this way. 
  }


  const handleOpenInNewTab = () => {
    window.open('https://github.com/jlab-sensing/DirtViz'); // this allows for a window to be opened on a new tab
    setContextMenuPosition(null);
  };

  const closeContextMenu = () => {
    setContextMenuPosition(null);
  }


  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
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
          flexDirection: { xs: 'column', md: 'row' }, // Column for small screens, row for medium+
          justifyContent: 'space-between',
          flexGrow: 1,
          padding: { xs: '5%', md: '2.5% 5%' },
          gap: { xs: '20px', md: '0' }, // Add gap for small screens
        }}
      >
        <Box
          sx={{
            flexGrow: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'start',
            gap: '20px',
          }}
        >
          <Typography
            variant='h2'
            component='h1'
            sx={{
              color: '#364F42',
              fontWeight: 'bold',
              fontSize: { xs: '2.0rem', md: '4rem' },
              textAlign: { xs: 'center', md: 'start' },
            }}
          >
            Data Visualization For Outdoor Sensor Networks
          </Typography>
          <Typography
            variant='h6'
            component='sub'
            sx={{
              color: '#588157',
              fontWeight: 'medium',
              fontSize: { xs: '0.90rem', md: '1.5rem' },
              textAlign: { xs: 'center', md: 'start' },
            }}
          >
            DirtViz is part of the Open Sensing Platform&apos;s hardware and software ecosystem for outdoor sensor
            networks. It&apos;s an open source data ingestion and visualization service that parses data from the
            hardware nodes and presents it in an easy-to-use web interface. Users can dynamically generate interactive
            plots, live monitor their sensors, or download data for offline processing.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' }, // Stack buttons on small screens
              gap: '10px',
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'center', sm: 'flex-start' },
            }}
          >
            <Button
              key='dashboard'
              onClick={() => navigate('/dashboard')}
              sx={{
                backgroundColor: '#B3C297',
                '&:hover': { backgroundColor: '#A3B18A' },
                color: '#364F42',
                px: '10px',
                width: { xs: '100%', sm: 'auto' }, // Full width for small screens
              }}
            >
              Checkout live data
            </Button>
            <Button
              key='dashboard-demo'
              onClick={() => navigate('/dashboard?cell_id=161')}
              sx={{
                px: '10px',
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              Demo
            </Button>
            <Button 
              sx={{
                px: '10px',
                width: { xs: '100%', sm: 'auto' },
              }}
              key='github'
              onClick={() => (location.href = 'https://github.com/jlab-sensing/DirtViz')}
              onContextMenu = {githubRightClick}
            >
              Github Repo &nbsp;
              <GitHubIcon fontSize='small' />
            </Button>

            <Box>
            {contextMenuPosition && (
              <Box
                sx = {{
                  position: 'absolute',
                  left: contextMenuPosition.x,
                  top: contextMenuPosition.y,
                }}
              >
                <ul style = {{listStyle: 'none', padding: '10px'}}>
                  <li
                    style = {{
                      padding: '10px 15px',
                      cursor: 'pointer',
                      color: '#2E8DCF',
                      border: '1px solid #000000',
                      backgroundColor: 'white',
                      margin: '0'
                    }}
                    onClick={handleOpenInNewTab} // Open link in new tab
                  >
                    Open Github Repo in New Tab
                  </li>
                  <li
                    style = {{
                      padding: '10px 15px',
                      cursor: 'pointer',
                      color: '#2E8DCF',
                      border: '1px solid #000000',
                      backgroundColor: 'white'
                    }}
                    onClick={closeContextMenu} // Open link in new tab
                  >
                    Option to Close this Menu
                  </li>

                </ul>
              </Box>

            )}
            </Box>
      
          </Box>
        </Box>
        <Box component='img' sx={{ width: 'auto', pb: { xs: '5%', sm: '2.5%' } }} src={chart}></Box>
        <></>
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
