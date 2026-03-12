// import { useEffect } from 'react';
import { Button } from '@mui/material';
import PropTypes from 'prop-types';
import { getCellData } from '../../../services/cell';
import { useState } from 'react';
function DownloadBtn({ cells, startDate, endDate }) {
  const [downloadStatus, setDownloadStatus] = useState(false);

  const downloadFile = async () => {
    if (!cells?.length) {
      return;
    }

    setDownloadStatus(true);

    try {
      const resample = 'none';
      const { blob, fileName } = await getCellData(
        cells.map((cell) => cell.id),
        resample,
        startDate,
        endDate,
      );

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = fileName || 'cell-data.csv';
      a.href = downloadUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error exporting CSV', error);
    } finally {
      setDownloadStatus(false);
    }
  };
  /** 
    exports cell data from json obj to csv.
    runs with static number of headers
  **/
  const exportToCsv = (e) => {
    e.preventDefault();
    void downloadFile();
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
