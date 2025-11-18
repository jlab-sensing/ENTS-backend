import { React } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Container, Divider, Grid, Stack, Typography } from '@mui/material';
import TopNav from '../../components/TopNav.jsx';
import LandingFooter from '../../components/LandingFooter.jsx';

function AnchorLink({ href, children }) {
  return (
    <Button
      component='a'
      href={href}
      sx={{
        textTransform: 'none',
        color: '#111827',
        px: 1.25,
        '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
      }}
    >
      {children}
    </Button>
  );
}

AnchorLink.propTypes = {
  href: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

function Docs() {
  return (
    <Box sx={{ width: '100vw', background: '#FFFFFF' }}>
      <TopNav />

      <Container maxWidth='lg' sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
          <Typography variant='h3' component='h1' sx={{ fontWeight: 900, color: '#0F172A' }}>
            EnTS Documentation 
          </Typography>
          
        </Box>

        {/* Page quick links */}
        <Box sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 0,
          border: '1px solid #E5E7EB',
          borderRadius: '999px',
          p: 0.5,
          mb: { xs: 4, md: 6 },
        }}>
          <AnchorLink href='#overview'>Overview</AnchorLink>
          <Divider orientation='vertical' flexItem sx={{ mx: 0.5, borderColor: '#E5E7EB' }} />
          <AnchorLink href='#frontend'>Frontend</AnchorLink>
          <Divider orientation='vertical' flexItem sx={{ mx: 0.5, borderColor: '#E5E7EB' }} />
          <AnchorLink href='#backend'>Backend</AnchorLink>
          <Divider orientation='vertical' flexItem sx={{ mx: 0.5, borderColor: '#E5E7EB' }} />
          <AnchorLink href='#schema'>Function</AnchorLink>
          <Divider orientation='vertical' flexItem sx={{ mx: 0.5, borderColor: '#E5E7EB' }} />
          <AnchorLink href='#setup'>Setup</AnchorLink>
         
        </Box>

        {/* Overview */}
        <Box id='overview' sx={{ mb: { xs: 4, md: 6 } }}>
          <Typography variant='h5' sx={{ fontWeight: 800, mb: 1 }}>Overview</Typography>
          <Typography variant='body1' sx={{ color: '#374151' }}>
            DirtViz is an open-source platform for visualizing environmental sensor networks. It combines a modern
            React frontend with a Python backend and a relational database to stream, store, and visualize sensor data in
            real time.
          </Typography>
        </Box>

        {/* Frontend */}
        <Box id='frontend' sx={{ mb: { xs: 4, md: 6 } }}>
          <Typography variant='h5' sx={{ fontWeight: 800, mb: 1 }}>Frontend</Typography>
          <Typography variant='body1' sx={{ color: '#374151', mb: 3 }}>
            The frontend is built with React and Vite, using Material UI for components, Chart.js for charts, and
            TanStack Query for data fetching/caching.
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' sx={{ fontWeight: 800, mb: 1 }}>Structure</Typography>
              <Box component='pre' sx={{ m: 0, p: 2, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 1, overflow: 'auto' }}>
{`frontend/
  src/
    components/        # Navbar, footer, shared UI
    pages/             # Home, Dashboard, Map, Profile, Docs
    charts/            # Chart.js wrappers & plugins
    services/          # API clients & auth
    auth/              # Auth context and hooks
`}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' sx={{ fontWeight: 800, mb: 1 }}>Key Components</Typography>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#374151' }}>
                <li><b>TopNav / Nav</b>: responsive navigation with auth.</li>
                <li><b>HeroStreamingPower</b>: animated, live-like power chart.</li>
                <li><b>Dashboard</b>: interactive charts and filters.</li>
              </ul>
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            <Typography variant='subtitle2' sx={{ fontWeight: 800, mb: 1 }}>Dashboard</Typography>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#374151' }}>
              <li>Route: <code>/dashboard</code>; responsive layout built with Material UI Grid.</li>
              <li>Charts: components under <code>frontend/src/charts</code> (e.g., <code>VwcChart</code>, <code>TempChart</code>, <code>PwrChart</code>), powered by Chart.js.</li>
              <li>Data fetching: TanStack Query hooks using axios clients in <code>frontend/src/services</code>.</li>
              <li>Filters: tag/cell filters and date-range utilities in <code>hooks/useSmartDateRange.js</code>.</li>
              <li>UX: zoom/pan plugins, downsampling, and synchronized axes for multi-chart comparisons.</li>
              <li>Auth-aware: protected data routes require a valid access token; handled by <code>useAxiosPrivate</code>.</li>
            </ul>
          </Box>
        </Box>

        {/* Backend */}
        <Box id='backend' sx={{ mb: { xs: 4, md: 6 } }}>
          <Typography variant='h5' sx={{ fontWeight: 800, mb: 1 }}>Backend</Typography>
          <Typography variant='body1' sx={{ color: '#374151', mb: 2 }}>
            The backend (Python) exposes RESTful endpoints, manages authentication, and persists sensor readings. It
            uses SQLAlchemy ORM with Alembic migrations. Resources under <code>backend/api/resources</code> map to
            models in <code>backend/api/models</code>.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' sx={{ fontWeight: 800, mb: 1 }}>Key Endpoints</Typography>
              <Box component='pre' sx={{ m: 0, p: 2, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 1, overflow: 'auto' }}>
{`Coming Soon`}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' sx={{ fontWeight: 800, mb: 1 }}>Environment Variables</Typography>
              <Box component='pre' sx={{ m: 0, p: 2, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 1, overflow: 'auto' }}>
{`DATABASE_URL=postgresql://user:pass@localhost:5432/dirtviz
SECRET_KEY=change-me
TTN_API_KEY=optional-ttn-token
FLASK_ENV=production`}
              </Box>
            </Grid>
          </Grid>
          <Typography variant='caption' sx={{ color: '#6B7280', display: 'block', mt: 1 }}>
            See <code>backend/api/resources</code> and tests under <code>backend/tests</code> for specifics.
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
            <Box sx={{ display: 'none' }} />
          </Box>
        </Box>

        {/* How it works */}
        <Box id='how-it-works' sx={{ mb: { xs: 4, md: 6 } }}>
          <Typography variant='h5' sx={{ fontWeight: 800, mb: 1 }}>How It Works</Typography>
          <Typography variant='body1' sx={{ color: '#374151' }}>
            Data flows from field sensors through gateways to the backend API where it is validated and stored. The
            frontend queries the API to render dashboards and live visualizations.
          </Typography>
          <ol style={{ margin: '12px 0 0 20px', color: '#374151' }}>
            <li>Sensor devices publish readings (e.g., via LoRaWAN / TTN integration).</li>
            <li>Backend receives payloads, normalizes units, and writes to the database.</li>
            <li>Frontend fetches aggregated data and streams recent points to charts.</li>
          </ol>
        </Box>

        {/* Setup */}
        <Box id='setup' sx={{ mb: { xs: 4, md: 6 } }}>
          <Typography variant='h5' sx={{ fontWeight: 800, mb: 1 }}>Setup Instructions</Typography>
          <Typography variant='body1' sx={{ color: '#374151' }}>
            I like big butts and I cannot lie. 
            Sir, you cannot write that on your paper!
            The greater the mass, the greater the force of attraction.
          </Typography>
        </Box>


          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' sx={{ fontWeight: 800, mb: 1 }}>Frontend</Typography>
              <Box component='pre' sx={{ m: 0, p: 2, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 1, overflow: 'auto' }}>
{`cd frontend
npm install
npm run dev`}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' sx={{ fontWeight: 800, mb: 1 }}>Backend</Typography>
              <Box component='pre' sx={{ m: 0, p: 2, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 1, overflow: 'auto' }}>
{`python -m venv .venv
source .venv/bin/activate  # (Windows: .venv\\Scripts\\activate)
pip install -r backend/requirements.txt
alembic upgrade head       # run migrations
python backend/wsgi.py`}
              </Box>
            </Grid>
          </Grid>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' sx={{ fontWeight: 800, mb: 1 }}>Testing</Typography>
              <Box component='pre' sx={{ m: 0, p: 2, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 1, overflow: 'auto' }}>
{`cd backend
pytest -q`}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle2' sx={{ fontWeight: 800, mb: 1 }}>Docker</Typography>
              <Box component='pre' sx={{ m: 0, p: 2, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 1, overflow: 'auto' }}>
{`docker-compose up --build -d
# Frontend at http://localhost:3000
# Backend at  http://localhost:8000`}
              </Box>
            </Grid>
          </Grid>
          <Typography variant='caption' sx={{ color: '#6B7280', display: 'block', mt: 1 }}>
            For Docker users, see docker-compose.yml at the repo root.
          </Typography>
        </Box>
        {/*board setup section*/}

        {/* Learn more */}
        <Box id='learn' sx={{ textAlign: 'center', mb: { xs: 2, md: 4 } }}>
          <Stack direction='row' spacing={2} sx={{ justifyContent: 'center' }}>
            <Button component='a' href='https://github.com/jlab-sensing/DirtViz' target='_blank' rel='noreferrer' variant='contained' sx={{ backgroundColor: '#111827', color: '#FFFFFF', textTransform: 'none', fontWeight: 800 }}>
              View on GitHub
            </Button>
            <Button component='a' href='https://sensors.soe.ucsc.edu/assets/pdf/madden2022smfcCurrentSense.pdf' target='_blank' rel='noreferrer' variant='text' sx={{ color: '#111827', textTransform: 'none', fontWeight: 800 }}>
              Read Research Paper
            </Button>
          </Stack>
        </Box>
      </Container>

      <LandingFooter />
    </Box>
  );
}

export default Docs;


