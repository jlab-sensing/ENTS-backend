// import { useEffect } from 'react';
import { Button } from '@mui/material';
import PropTypes from 'prop-types';
import { getCellData, pollCellDataResult } from '../../../services/cell';
import { useState } from 'react';
function DownloadBtn({ cells, startDate, endDate }) {
  const [downloadStatus, setDownloadStatus] = useState(false);

  const INTERVAL = 2000;
  const BACKOFF = 2000;
  let pendingResponses = 0;

  const pollTaskStatus = async (taskId, fileName, pollDuration) => {
    try {
      const { state, status } = await pollCellDataResult(taskId);
      if (state === 'SUCCESS') {
        const blob = new Blob([status], { type: 'text/csv' });
        const a = document.createElement('a');
        a.download = fileName;
        a.href = window.URL.createObjectURL(blob);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setDownloadStatus(false);
      } else {
        setTimeout(() => {
          pendingResponses += 1;
          pollDuration = BACKOFF * pendingResponses + pollDuration;
          return pollTaskStatus(taskId, fileName, pollDuration);
        }, pollDuration);
      }
    } catch (error) {
      console.error('Error polling the task status', error);
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
  );
}

DownloadBtn.propTypes = {
  cells: PropTypes.array,
  startDate: PropTypes.any,
  endDate: PropTypes.any,
  disabled: PropTypes.bool,
  setDBtnDisabled: PropTypes.func.isRequired,
};

export default DownloadBtn;
