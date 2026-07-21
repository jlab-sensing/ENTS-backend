import { Button } from '@mui/material';
import PropTypes from 'prop-types';
import { useState } from 'react';
import {
  buildDashboardCsv,
  defaultCsvFilename,
  triggerCsvDownload,
} from '../catalog/dashboardCsv';

/**
 * Export currently loaded dashboard chart series to CSV in the browser.
 * Does not call the backend Celery export path (see #468 / #668).
 */
function DownloadBtn({
  cells,
  panelOrder,
  historicalPowerByCell,
  historicalTerosByCell,
  historicalSensorByKey,
  historicalLoading = false,
  disabled = false,
}) {
  const [downloadStatus, setDownloadStatus] = useState(false);

  const exportToCsv = (event) => {
    event.preventDefault();
    if (disabled || historicalLoading || downloadStatus || !cells?.length) return;

    setDownloadStatus(true);
    try {
      const csvText = buildDashboardCsv({
        cells,
        panelOrder,
        historicalPowerByCell,
        historicalTerosByCell,
        historicalSensorByKey,
      });
      triggerCsvDownload(defaultCsvFilename(cells), csvText);
    } catch (error) {
      console.error('CSV export failed', error);
    } finally {
      setDownloadStatus(false);
    }
  };

  const isDisabled = disabled || historicalLoading || downloadStatus || !cells?.length;

  return (
    <div className='DownloadBtn'>
      <Button disabled={isDisabled} variant='outlined' onClick={exportToCsv}>
        {downloadStatus || historicalLoading ? 'DOWNLOADING...' : 'Export to CSV'}
      </Button>
    </div>
  );
}

DownloadBtn.propTypes = {
  cells: PropTypes.array,
  panelOrder: PropTypes.arrayOf(PropTypes.string),
  historicalPowerByCell: PropTypes.object,
  historicalTerosByCell: PropTypes.object,
  historicalSensorByKey: PropTypes.object,
  historicalLoading: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default DownloadBtn;
