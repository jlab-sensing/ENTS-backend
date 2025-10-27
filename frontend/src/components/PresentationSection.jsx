import { React } from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

function PresentationSection() {
  const googleDrivePreviewUrl = 'https://drive.google.com/file/d/1EdlY8_j2NPVKz00yRHgZcNq54oZtk8mT/preview?usp=sharing&embedded=true&rm=minimal&chrome=false&toolbar=0&navpanes=0&scrollbar=0&view=FitH';
  const googleDriveViewUrl = 'https://drive.google.com/file/d/1EdlY8_j2NPVKz00yRHgZcNq54oZtk8mT/view';
  const googleDriveDownloadUrl = 'https://drive.google.com/uc?export=download&id=1EdlY8_j2NPVKz00yRHgZcNq54oZtk8mT';

  return (
    <Box
      component="section"
      sx={{
        background: 'linear-gradient(180deg, #F2F5F0 0%, #E8EEE6 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 6, md: 10 },
      }}
    >
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Box 
            sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 1.5, 
              mb: 3,
              px: 3,
              py: 1,
              borderRadius: '12px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(58, 90, 64, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(58, 90, 64, 0.05)',
                borderColor: 'rgba(58, 90, 64, 0.3)',
                transform: 'translateY(-1px)',
              }
            }}
          >
            <PlayCircleOutlineIcon sx={{ fontSize: '1rem', color: '#3A5A40', opacity: 0.8 }} />
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#3A5A40', 
                fontWeight: 500,
                letterSpacing: '0.3px',
                textTransform: 'none',
                fontSize: '0.875rem'
              }}
            >
              Project Overview
            </Typography>
          </Box>
          
          <Typography 
            variant="h3" 
            component="h2"
            sx={{ 
              fontWeight: 700, 
              color: '#2C3E3C',
              mb: 2,
              fontSize: { xs: '1.75rem', md: '2.5rem' }
            }}
          >
            EnTS Presentation
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#5A6C6A', 
              maxWidth: '600px', 
              mx: 'auto',
              fontSize: { xs: '0.95rem', md: '1.05rem' },
              lineHeight: 1.7
            }}
          >
            Learn about our open-source data visualization platform for outdoor sensor monitoring
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 2, 
            justifyContent: 'center',
            mb: 4,
            flexWrap: 'wrap'
          }}
        >
          <Button
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            href={googleDriveViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              borderColor: '#3A5A40',
              color: '#3A5A40',
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: '8px',
              textTransform: 'none',
              '&:hover': {
                borderColor: '#2C4632',
                backgroundColor: 'rgba(58, 90, 64, 0.05)',
              }
            }}
          >
            Open in New Tab
          </Button>
          
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            href={googleDriveDownloadUrl}
            sx={{
              backgroundColor: '#3A5A40',
              color: 'white',
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: '8px',
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(58, 90, 64, 0.2)',
              '&:hover': {
                backgroundColor: '#2C4632',
                boxShadow: '0 6px 16px rgba(58, 90, 64, 0.3)',
              }
            }}
          >
            Download PDF
          </Button>
        </Box>

        {/* Presentation Embed */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            backgroundColor: '#FFFFFF',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #3A5A40 0%, #588157 100%)',
              zIndex: 1,
            }
          }}
        >
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: { 
                xs: '120vh',
                sm: '90vh',
                md: '100vh'
              },
              minHeight: { xs: '600px', md: '500px' },
              backgroundColor: '#FFFFFF',
              overflow: 'hidden',
            }}
          >
          <iframe
              src={googleDrivePreviewUrl}
              allow="autoplay"
            title="DirtViz Presentation"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 0,
                backgroundColor: '#FFFFFF',
              }}
            />
          </Box>
        </Paper>

        {/* Info Footer */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#7A8C8A',
              fontSize: '0.875rem'
            }}
          >
            Having trouble viewing? Try opening in a new tab or downloading the PDF
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

export default PresentationSection;


