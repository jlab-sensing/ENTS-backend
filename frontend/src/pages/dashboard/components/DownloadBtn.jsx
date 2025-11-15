// import { useEffect } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import PropTypes from 'prop-types';
import { getCellData, pollCellDataResult } from '../../../services/cell';
import { useState } from 'react';
function DownloadBtn({ cells, startDate, endDate }) {
  const [downloadStatus, setDownloadStatus] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const INTERVAL = 2000;
  const BACKOFF = 2000;
  const MAX_POLL_ATTEMPTS = 30; // 30 attempts * 2s = ~60s max timeout
  let pendingResponses = 0;

  const showNotification = (message, severity = 'error') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const pollTaskStatus = async (taskId, fileName, pollDuration, attempt = 0) => {
    try {
      const { state, status, error } = await pollCellDataResult(taskId);
      
      if (state === 'SUCCESS') {
        // Only download if the status is actual CSV data, not an error message
        const blob = new Blob([status], { type: 'text/csv' });
        const a = document.createElement('a');
        a.download = fileName;
        a.href = window.URL.createObjectURL(blob);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setDownloadStatus(false);
        showNotification('CSV downloaded successfully!', 'success');
      } else if (state === 'FAILURE' || error === true) {
        // Handle failure state - don't download error messages as CSV
        console.error('CSV generation failed:', status);
        showNotification(`Failed to generate CSV: ${status}`, 'error');
        setDownloadStatus(false);
      } else if (attempt >= MAX_POLL_ATTEMPTS) {
        // Timeout - too many attempts
        console.error('CSV download timeout - task is still pending');
        showNotification('Download timeout. The task is taking too long. Please try again later.', 'warning');
        setDownloadStatus(false);
      } else {
        // Continue polling for PENDING or other states
        setTimeout(() => {
          pendingResponses += 1;
          pollDuration = BACKOFF * pendingResponses + pollDuration;
          return pollTaskStatus(taskId, fileName, pollDuration, attempt + 1);
        }, pollDuration);
      }
    } catch (error) {
      console.error('Error polling the task status', error);
      showNotification('Error downloading CSV. Please try again.', 'error');
      setDownloadStatus(false);
    }
  };

  const downloadFile = () => {
    for (const { id, name } of cells) {
      setDownloadStatus(true);
      const fileName = name + '.csv';
      const resample = 'none';
      getCellData(id, resample, startDate, endDate).then((data) => {
        const { result_id } = data;
        pollTaskStatus(result_id, fileName, INTERVAL);
      });
    }
  };
  /** 
    exports cell data from json obj to csv.
    runs with static number of headers
  **/
  const exportToCsv = (e) => {
    e.preventDefault();
    downloadFile();
  };
  return (
    <>
      <div className='DownloadBtn'>
        {downloadStatus ? (
          <Button disabled={true} variant='outlined' onClick={exportToCsv}>
            DOWNLOADING...
          </Button>
        ) : (
          <Button disabled={false} variant='outlined' onClick={exportToCsv}>
            Export to CSV
          </Button>
        )}
      </div>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}

DownloadBtn.propTypes = {
  cells: PropTypes.array.isRequired,
  startDate: PropTypes.any.isRequired,
  endDate: PropTypes.any.isRequired,
};

export default DownloadBtn;
