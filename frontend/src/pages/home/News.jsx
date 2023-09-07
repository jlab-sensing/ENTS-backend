import { React } from 'react';
import { Box } from '@mui/material';

function News() {
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        position: 'relative',
        scrollSnapAlign: 'center',
        display: 'flex',
        scrollSnapStop: 'always',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#DAD7CD',
      }}
    >
      {/* NEWS PAGE */}
      <p>NEWS</p>
    </Box>
  );
}

export default News;
