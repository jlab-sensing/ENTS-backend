import { Alert, Snackbar } from '@mui/material';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import React from 'react';

function DateRangeNotification({ open, onClose, fallbackStartDate, fallbackEndDate }) {
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return DateTime.fromJSDate(date).toFormat('MMM dd, yyyy HH:mm');
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={8000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity='info' sx={{ width: '100%' }}>
        No recent data available. Showing the most recent data from <strong>{formatDate(fallbackStartDate)}</strong> to{' '}
        <strong>{formatDate(fallbackEndDate)}</strong>.
      </Alert>
    </Snackbar>
  );
}

DateRangeNotification.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  fallbackStartDate: PropTypes.object,
  fallbackEndDate: PropTypes.object,
};

export default DateRangeNotification;
