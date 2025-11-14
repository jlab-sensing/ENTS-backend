import { React } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import LandingFooter from '../../components/LandingFooter.jsx';
import FeatureSection from '../dashboard/components/FeatureSection.jsx';
import PresentationSection from '../../components/PresentationSection.jsx';
import SectionHeader from '../../components/SectionHeader.jsx';
import HeroStreamingPower from './HeroStreamingPower.jsx';
import TopNav from '../../components/TopNav.jsx';

function Intro() {
  return (
    // 1. This is the main, non-scrollable container
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopNav />

      {/* 2. This Box is the scrollable area */}
      <Box sx={{ flex: 1, overflowY: 'auto', background: '#FFFFFF' }}>

        {/* Unified hero section: headline + live chart */}
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: { xs: '6%', md: '10%' },
            py: { xs: '10%', md: '6%' },
          }}
        >
          <Box sx={{ maxWidth: '1120px', width: '100%' }}>
            <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 5 } }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '999px', px: 1.25, py: 0.5 }}>
                <Typography variant='caption' sx={{ color: '#111827', fontWeight: 700 }}>Welcome to EnTS</Typography>
              </Box>
              <Typography variant='h2' component='h1' sx={{ mt: 2, fontWeight: 900, fontSize: { xs: '2.4rem', md: '3.4rem' }, lineHeight: 1.1, letterSpacing: '-0.02em', color: '#0F172A' }}>
              Data Visualization for Outdoor Sensor
              </Typography>
              <Typography variant='body1' sx={{ color: '#4B5563', mt: 1.5, fontSize: { xs: '0.98rem', md: '1.05rem' } }}>
              Open-source tools to monitor, analyze, and share sensor data from the field—live and interactive.
              </Typography>
              <Stack direction='row' spacing={2} sx={{ mt: 3, justifyContent: 'center' }}>
                <Button href='/dashboard' variant='contained' sx={{ backgroundColor: '#111827', color: '#FFFFFF', fontWeight: 800, borderRadius: '999px', px: 2.5, py: 1, '&:hover': { backgroundColor: '#0B1220' } }}>
                  Get Started
                </Button>
                <Button href='/docs' variant='text' sx={{ color: '#111827', fontWeight: 800, textTransform: 'none' }}>
                  Learn more →
                </Button>
              </Stack>
            </Box>

            {/* Card holding the live chart */}
            <Box sx={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '16px', p: { xs: 2, md: 3 }, boxShadow: 'inset 0px -6px 13px 6px rgba(0, 0, 0, 0.06)' }}>
              <HeroStreamingPower height={'calc(300px + (420 - 300) * ((100vw - 320px) / (1600 - 320)))' } />
            </Box>
          </Box>
        </Box>

        <SectionHeader title={'Presentation'} />
        <PresentationSection />
        <SectionHeader title={'Features'} />
        <FeatureSection />

        <LandingFooter />
      </Box>
    </Box>
  );
}

export default Intro;
