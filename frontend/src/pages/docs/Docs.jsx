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
            DirtViz Documentation
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
          <AnchorLink href='#schema'>Schema</AnchorLink>
          <Divider orientation='vertical' flexItem sx={{ mx: 0.5, borderColor: '#E5E7EB' }} />
          <AnchorLink href='#hardware'>Hardware</AnchorLink>
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

        {/* Hardware Setup */}
        <Box id='hardware' sx={{ mb: { xs: 4, md: 6 } }}>
          <Typography variant='h5' sx={{ fontWeight: 800, mb: 1 }}>Hardware Setup</Typography>
          <Typography variant='body1' sx={{ color: '#374151', mb: 4 }}>
            Step-by-step instructions for setting up ENTS hardware boards with visual guides for each configuration step.
          </Typography>
          
          {/* Step 1 */}
          <Box sx={{ mb: 4, p: 3, border: '1px solid #E5E7EB', borderRadius: 2, backgroundColor: '#FAFAFA' }}>
            <Grid container spacing={3} alignItems='center'>
              <Grid item xs={12} md={6}>
                <Typography variant='h6' sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>
                  Step 1: Power the Device
                </Typography>
                <Typography variant='body1' sx={{ color: '#374151', mb: 2 }}>
                  Plug in the device to power or power cycle the device to initialize the ENTS board.
                </Typography>
                <Typography variant='body2' sx={{ color: '#6B7280', fontStyle: 'italic' }}>
                  The device will start broadcasting its configuration WiFi network once powered on.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  border: '1px solid #E5E7EB'
                }}>
                  <img
                    src='/assets/hardware-setup-step1.png'
                    alt='Device power connection'
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    onError={(e) => { 
                      e.currentTarget.style.display = 'none'; 
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }}
                  />
                  <Box sx={{ 
                    height: 200, 
                    backgroundColor: '#F3F4F6', 
                    display: 'none',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '2px dashed #D1D5DB'
                  }}>
                    <Typography variant='body2' sx={{ color: '#6B7280' }}>
                      [Screenshot: Device power connection]
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Step 2 */}
          <Box sx={{ mb: 4, p: 3, border: '1px solid #E5E7EB', borderRadius: 2, backgroundColor: '#FAFAFA' }}>
            <Grid container spacing={3} alignItems='center'>
              <Grid item xs={12} md={6}>
                <Typography variant='h6' sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>
                  Step 2: Connect to ENTS Network
                </Typography>
                <Typography variant='body1' sx={{ color: '#374151', mb: 2 }}>
                  Connect to the WiFi network <code>ents-xxx</code> where xxx is the logger ID. If unconfigured, it will show <code>ents-unconfigured</code>.
                </Typography>
                <Typography variant='body2' sx={{ color: '#6B7280', fontStyle: 'italic' }}>
                  Note: The WiFi network turns off after 1 minute to save power. Power cycle if needed.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  border: '1px solid #E5E7EB'
                }}>
                  <img
                    src='/assets/hardware-setup-step1.png'
                    alt='WiFi settings showing ents-200 network'
                    style={{ width: '100%', height: '60%', display: 'block' }}
                    onError={(e) => { 
                      e.currentTarget.style.display = 'none'; 
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }}
                  />
                  <Box sx={{ 
                    height: 200, 
                    backgroundColor: '#F3F4F6', 
                    display: 'none',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '2px dashed #D1D5DB'
                  }}>
                    <Typography variant='body2' sx={{ color: '#6B7280' }}>
                      [Screenshot: WiFi settings showing ents-200 network]
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Step 3 */}
          <Box sx={{ mb: 4, p: 3, border: '1px solid #E5E7EB', borderRadius: 2, backgroundColor: '#FAFAFA' }}>
            <Grid container spacing={3} alignItems='center'>
              <Grid item xs={12} md={6}>
                <Typography variant='h6' sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>
                  Step 3: Access Configuration Interface
                </Typography>
                <Typography variant='body1' sx={{ color: '#374151', mb: 2 }}>
                  Navigate to <code>https://192.168.4.1/</code> in your browser to access the ENTS configuration interface.
                </Typography>
                <Typography variant='body2' sx={{ color: '#6B7280', fontStyle: 'italic' }}>
                  The Cell ID and Logger ID can be obtained from your DirtViz profile.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  border: '1px solid #E5E7EB'
                }}>
                  <img
                    src='/assets/hardware-setup-step3.png'
                    alt='ENTS Configuration web interface'
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    onError={(e) => { 
                      e.currentTarget.style.display = 'none'; 
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }}
                  />
                  <Box sx={{ 
                    height: 200, 
                    backgroundColor: '#F3F4F6', 
                    display: 'none',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '2px dashed #D1D5DB'
                  }}>
                    <Typography variant='body2' sx={{ color: '#6B7280' }}>
                      [Screenshot: ENTS Configuration web interface]
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Step 4 */}
          <Box sx={{ mb: 4, p: 3, border: '1px solid #E5E7EB', borderRadius: 2, backgroundColor: '#FAFAFA' }}>
            <Grid container spacing={3} alignItems='center'>
              <Grid item xs={12} md={6}>
                <Typography variant='h6' sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>
                  Step 4: Configure the Board
                </Typography>
                <Typography variant='body1' sx={{ color: '#374151', mb: 2 }}>
                  Configure the following settings:
                </Typography>
                <Box component='ul' sx={{ margin: 0, paddingLeft: 20, color: '#374151', fontSize: '0.875rem' }}>
                  <li>Set Logger ID and Cell ID</li>
                  <li>Choose Upload Method (WiFi recommended)</li>
                  <li>Set Upload Interval (e.g., 10 seconds)</li>
                  <li>Select enabled measurements</li>
                  <li>Configure WiFi credentials</li>
                  <li>Set API endpoint URL</li>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  border: '1px solid #E5E7EB'
                }}>
                  <img
                    src='/assets/hardware-setup-step4.png'
                    alt='Configuration form with all settings'
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    onError={(e) => { 
                      e.currentTarget.style.display = 'none'; 
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }}
                  />
                  <Box sx={{ 
                    height: 200, 
                    backgroundColor: '#F3F4F6', 
                    display: 'none',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '2px dashed #D1D5DB'
                  }}>
                    <Typography variant='body2' sx={{ color: '#6B7280' }}>
                      [Screenshot: Configuration form with all settings]
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Step 5 */}
          <Box sx={{ mb: 4, p: 3, border: '1px solid #E5E7EB', borderRadius: 2, backgroundColor: '#FAFAFA' }}>
            <Grid container spacing={3} alignItems='center'>
              <Grid item xs={12} md={6}>
                <Typography variant='h6' sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>
                  Step 5: Save Configuration
                </Typography>
                <Typography variant='body1' sx={{ color: '#374151', mb: 2 }}>
                  Click "Save Configuration" to save your settings to the device.
                </Typography>
                <Typography variant='body2' sx={{ color: '#6B7280', fontStyle: 'italic' }}>
                  You should see a "Success!" message indicating the configuration was saved successfully.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  border: '1px solid #E5E7EB'
                }}>
                  <img
                    src='/assets/hardware-setup-step5.png'
                    alt='Success popup with reset message'
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    onError={(e) => { 
                      e.currentTarget.style.display = 'none'; 
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }}
                  />
                  <Box sx={{ 
                    height: 200, 
                    backgroundColor: '#F3F4F6', 
                    display: 'none',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '2px dashed #D1D5DB'
                  }}>
                    <Typography variant='body2' sx={{ color: '#6B7280' }}>
                      [Screenshot: Success popup with reset message]
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Step 6 */}
          <Box sx={{ mb: 4, p: 3, border: '1px solid #E5E7EB', borderRadius: 2, backgroundColor: '#FAFAFA' }}>
            <Grid container spacing={3} alignItems='center'>
              <Grid item xs={12} md={6}>
                <Typography variant='h6' sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>
                  Step 6: Reset the Board
                </Typography>
                <Typography variant='body1' sx={{ color: '#374151', mb: 2 }}>
                  Press the reset button (top right white button) on the ENTS board to apply the new configuration.
                </Typography>
                <Typography variant='body2' sx={{ color: '#6B7280', fontStyle: 'italic' }}>
                  The board will restart and begin uploading data with the new settings.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  border: '1px solid #E5E7EB'
                }}>
                  <img
                    src='/assets/hardware-setup-step6.png'
                    alt='Physical board with reset button highlighted'
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    onError={(e) => { 
                      e.currentTarget.style.display = 'none'; 
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }}
                  />
                  <Box sx={{ 
                    height: 200, 
                    backgroundColor: '#F3F4F6', 
                    display: 'none',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '2px dashed #D1D5DB'
                  }}>
                    <Typography variant='body2' sx={{ color: '#6B7280' }}>
                      [Screenshot: Physical board with reset button highlighted]
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Configuration Summary */}
          <Box sx={{ mt: 4, p: 3, backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 2 }}>
            <Typography variant='h6' sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
              Configuration Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1 }}>Upload Settings</Typography>
                <Box component='pre' sx={{ m: 0, p: 2, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 1, overflow: 'auto', fontSize: '0.875rem' }}>
{`Logger ID: (from your profile)
Cell ID: (from your profile)  
Upload Method: WiFi
Upload Interval: 10 seconds`}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant='subtitle2' sx={{ fontWeight: 600, mb: 1 }}>Measurement & WiFi</Typography>
                <Box component='pre' sx={{ m: 0, p: 2, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 1, overflow: 'auto', fontSize: '0.875rem' }}>
{`Measurements: ☑ Voltage
WiFi SSID: Your network
WiFi Password: Your password
API Endpoint: http://dirtviz.jlab.ucsc.edu/api/sensor/`}
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          <Typography variant='body2' sx={{ color: '#6B7280', mt: 3, fontStyle: 'italic', textAlign: 'center' }}>
            After successful configuration, the board will automatically connect to your specified WiFi network and begin uploading sensor data to the configured API endpoint.
          </Typography>
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
{`docker-compose up --build
# Frontend at http://localhost:3000
# Backend at  http://localhost:8000`}
              </Box>
            </Grid>
          </Grid>
          <Typography variant='caption' sx={{ color: '#6B7280', display: 'block', mt: 1 }}>
            For Docker users, see docker-compose.yml at the repo root.
          </Typography>
        </Box>

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


