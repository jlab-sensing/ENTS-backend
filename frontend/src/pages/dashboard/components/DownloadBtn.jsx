import { Button } from '@mui/material';
import PropTypes from 'prop-types';
import { useState } from 'react';
import {
  buildDashboardCsvExports,
  triggerCsvDownload,
} from '../catalog/dashboardCsv';

/** Stagger multi-file downloads so browsers do not collapse them into one save. */
const MULTI_DOWNLOAD_STAGGER_MS = 150;

/**
 * Export currently loaded dashboard chart series to CSV in the browser.
 * One file per selected cell (e.g. Cell_A.csv, Cell_B.csv).
 */
function DownloadBtn({
  cells,
  panelOrder,
  historicalPowerByCell,
  historicalTerosByCell,
  historicalSensorByKey,
  cellSensorsById = {},
  historicalLoading = false,
  disabled = false,
}) {
  const [downloadStatus, setDownloadStatus] = useState(false);

  const exportToCsv = (event) => {
    event.preventDefault();
    if (disabled || historicalLoading || downloadStatus || !cells?.length) return;

    setDownloadStatus(true);
    try {
      const exports = buildDashboardCsvExports({
        cells,
        panelOrder,
        historicalPowerByCell,
        historicalTerosByCell,
        historicalSensorByKey,
        cellSensorsById,
      });

      if (exports.length === 0) {
        setDownloadStatus(false);
        return;
      }

      exports.forEach(({ filename, csvText }, index) => {
        window.setTimeout(() => {
          triggerCsvDownload(filename, csvText);
          if (index === exports.length - 1) {
            setDownloadStatus(false);
          }
        }, index * MULTI_DOWNLOAD_STAGGER_MS);
      });
    } catch (error) {
      console.error('CSV export failed', error);
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
  cellSensorsById: PropTypes.object,
  historicalLoading: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default DownloadBtn;
