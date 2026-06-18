import { Alert, Snackbar } from '@mui/material';
import PropTypes from 'prop-types';
import React from 'react';
import { getCatalogEntry } from '../pages/dashboard/catalog/dashboardCatalog';

function LayoutMismatchNotification({ open, onClose, missingPanelIds }) {
  const labels = missingPanelIds
    .map((panelId) => getCatalogEntry(panelId)?.label || panelId)
    .join(', ');

  return (
    <Snackbar
      open={open}
      autoHideDuration={10000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity='warning' sx={{ width: '100%' }}>
        Some charts in your saved layout are not available for the selected cell(s):{' '}
        <strong>{labels}</strong>. Those panels may show no data.
      </Alert>
    </Snackbar>
  );
}

LayoutMismatchNotification.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  missingPanelIds: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default LayoutMismatchNotification;
