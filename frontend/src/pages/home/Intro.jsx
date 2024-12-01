import { React } from 'react';
import { Box, Typography } from '@mui/material';
import soilSensor from '../../assets/soil-sensor.svg';
import DescriptionIcon from '@mui/icons-material/Description';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import Footer from '../../components/Footer.jsx';

function Intro() {
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        position: 'relative',
        scrollSnapAlign: 'center',
        scrollSnapStop: 'always',
        // display: 'flex',
        // flexDirection: 'column',
        // justifyContent: 'space-evenly',
        // backgroundImage: `url(${aboutBg})`,
        // backgroundSize: 'cover',
        // backgroundPosition: 'center',
        // backgroundColor: '#B3C297',
        backgroundColor: '#C0C5AD',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-evenly',
          flexGrow: 1,
          paddingTop: '2.5%',
          paddingRight: '5%',
          paddingLeft: '5%',
          paddingBottom: '2.5%',
          height: '95%',
          width: '90%',
          gap: '5%',
        }}
      >
        {/* About PAGE */}
        <Typography variant='h2' component='h1' sx={{ color: '#364F42', fontWeight: 'bold' }}>
          Research
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' }, // Column for small screens, row for medium+
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: { xs: '20px', md: '5%' }, // Add gap for small screens
            height: '100%',
          }}
        >
          <Box
            component='img'
            sx={{ flex: '0 0 auto', width: 'auto', height: '30vh', objectFit: 'scale-down' }}
            src={soilSensor}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2%', height: '100%' }}>
            <Typography
              variant='h3'
              component={'h3'}
              sx={{
                color: '#3A5A40',
                fontSize: { xs: '2.0rem' },
                textAlign: { xs: 'center', md: 'start' },
                textJustify: 'inter-word',
              }}
            >
              Hardware to enable large-scale deployment and observation of soil microbial fuel cells
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignContent: 'start' }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: { xs: 'center', sm: 'start' }, // Center-align on xs, start-align on md+
                  maxWidth: { xs: '90%', sm: '100%' }, // Slightly smaller than the width of the text above
                  margin: { xs: '0 auto', sm: '0' }, // Ensures it's centered on small screens
                }}
              >
                <Typography
                  variant='h6'
                  sx={{
                    fontStyle: 'italic',
                    color: '#588157',
                    fontSize: { xs: '1rem' },
                    textAlign: { xs: 'center', sm: 'start' },
                  }}
                >
                  John Madden, Gabriel Marcano, Stephen Taylor, Pat Pannuto, and Colleen Josephson
                </Typography>
              </Box>
              {/* Blank line */}
              <Typography
                variant='h6'
                sx={{
                  fontStyle: 'italic',
                  color: '#588157',
                  fontSize: { xs: '1rem' },
                  textAlign: { xs: 'center', md: 'start' },
                }}
              >
                {'\u00A0'}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: { xs: 'center', sm: 'start' }, // Center-align on xs, start-align on md+
                  maxWidth: { xs: '90%', md: '100%' }, // Slightly smaller than the width of the text above
                  margin: { xs: '0 auto', sm: '0' }, // Ensures it's centered on small screens
                }}
              >
                <Typography
                  variant='h6'
                  sx={{
                    fontStyle: 'italic',
                    color: '#588157',
                    fontSize: { xs: '1rem' },
                    textAlign: { xs: 'center', sm: 'start' },
                  }}
                >
                  In Proceedings of the Tenth ACM International Workshop on Energy Harvesting and Energy-Neutral Sensing
                  Systems Nov 2022
                </Typography>
              </Box>
            </Box>

            {/* <Typography varient='subtitle1'> */}
            {/*   Soil microbial fuel cells are a promising source of energy for outdoor sensor networks. These biological */}
            {/*   systems are sensitive to environmental conditions, therefore more data is needed on their behavior “in the */}
            {/*   wild” to enable the creation of an energy system capable of being widely deployed. Prior work on early */}
            {/*   characterization of microbial fuel cells relied on extremely accurate, but expensive, logging hardware. To */}
            {/*   scale up the number of deployment sites, we present custom logging hardware, specially designed to */}
            {/*   accurately monitor the behavior of microbial fuel cells at low cost. */}
            {/* </Typography> */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: '2%',
                justifyContent: { xs: 'center', sm: 'start' },
                width: '100%',
              }}
            >
              <Box
                component={'a'}
                sx={{ display: 'flex', flexDirection: 'row', gap: '3px', color: '#588157' }}
                href='https://sensors.soe.ucsc.edu/assets/pdf/madden2022smfcCurrentSense.pdf'
              >
                <DescriptionIcon sx={{ alignSelf: 'center' }} fontSize='small' /> ENSsys2022
              </Box>
              <Box
                component={'a'}
                sx={{ display: 'flex', flexDirection: 'row', gap: '3px', color: '#588157' }}
                href='https://sensors.soe.ucsc.edu/assets/pdf/ENSsys%202022%20MFC.pptx.pdf'
              >
                <SlideshowIcon sx={{ alignSelf: 'center' }} fontSize='small' /> Slides
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}

export default Intro;
