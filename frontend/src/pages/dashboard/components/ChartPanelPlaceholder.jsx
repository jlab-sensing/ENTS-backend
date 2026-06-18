import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';

function ChartPanelPlaceholder({ message = 'No data for the selected cells or date range.', loading = false }) {
  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        minWidth: 0,
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        textAlign: 'center',
      }}
    >
      <Typography variant='body2' color='text.secondary'>
        {loading ? 'Loading chart...' : message}
      </Typography>
    </Box>
  );
}

ChartPanelPlaceholder.propTypes = {
  message: PropTypes.string,
  loading: PropTypes.bool,
};

export default ChartPanelPlaceholder;
