import { React } from 'react';
import { Box, Container, Typography } from '@mui/material';
import TopNav from '../../components/TopNav.jsx';
import LandingFooter from '../../components/LandingFooter.jsx';

function Docs() {
  return (
    <Box sx={{ width: '100vw', background: '#FFFFFF' }}>
      <TopNav />

      <Container maxWidth='lg' sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
          <Typography variant='h3' component='h1' sx={{ fontWeight: 900, color: '#0F172A' }}>
            Database Schema
          </Typography>
          <Typography variant='body1' sx={{ color: '#6B7280', mt: 1 }}>
            For complete documentation, please see the main README in the repository.
          </Typography>
        </Box>

        {/* Schema */}
        <Box id='schema' sx={{ mb: { xs: 4, md: 6 } }}>
          <Typography variant='h5' sx={{ fontWeight: 800, mb: 1 }}>Database Schema</Typography>
          <Typography variant='body1' sx={{ color: '#374151', mb: 2 }}>
            The ER diagram shows tables for users, sensors, loggers, cells, and time-series measurements.
          </Typography>
          <Box sx={{ border: '1px solid #E5E7EB', borderRadius: 1, p: 1, background: '#FFFFFF' }}>
            <img
              src='/assets/db.png'
              alt='Database schema diagram'
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 6 }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </Box>
        </Box>
      </Container>

      <LandingFooter />
    </Box>
  );
}

export default Docs;


