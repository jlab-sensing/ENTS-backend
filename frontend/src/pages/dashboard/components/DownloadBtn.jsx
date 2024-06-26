// import { useEffect } from 'react';
import { Button } from '@mui/material';
import PropTypes from 'prop-types';
import { getCellData, pollCellDataResult } from '../../../services/cell';
import { useState } from 'react';
// import { DateTime } from 'luxon';
// import { useQuery, useQueryClient } from '@tanstack/react-query';

// const directions = Object.freeze({ 
//   IN_PROGRESS: 0,
//   IDLE: 1,
//   ERROR: 2,

// });

function DownloadBtn({ cells, startDate, endDate }) {
  // Get QueryClient from the context
  // const queryClient = useQueryClient();

  const [downloadStatus, setDownloadStatus] = useState(false);

  // useEffect(() => {
  //   queryClient.invalidateQueries({ queryKey: ['cells'] });
  // }, [cells, startDate, endDate, queryClient]);

  // const { isLoading, isError, data, error } = useQuery({
  //   queryKey: ['cells'],
  //   queryFn: () =>
  //     getCellData(
  //       cells.map((c) => c.id),
  //       'none',
  //       startDate,
  //       endDate,
  //     ),
  //   enabled: !!(Array.isArray(cells) && cells.length),
  //   refetchOnWindowFocus: false,
  // });

  const pollTaskStatus = async (taskId, fileName) => {
    const interval = setInterval(async () => {
      try {
        const {state, status} = await pollCellDataResult(taskId);
        console.log("polling task, state: ",  state, " status: ", status);
        if (state === "SUCCESS") {
          clearInterval(interval);
          console.log("starting download!, data: ", status
          );
          const blob = new Blob([status], { type: 'text/csv' });
          const a = document.createElement('a');
          a.download = fileName;
          a.href = window.URL.createObjectURL(blob);
          const clickEvt = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
          });
          a.dispatchEvent(clickEvt);
          a.remove();
          setDownloadStatus(false)
        }else{
          setDownloadStatus(true)
        }
      } catch (error) {
        console.error('Error polling the task status', error);
        clearInterval(interval);
      }
    }, 2000); // Poll every 2 seconds
  };

  const downloadFile = () => {
    for (const { id, name } of cells) {
      const fileName = name + '.csv';
      const resample = 'none';
      getCellData(id, resample, startDate, endDate).then((data) => {
        console.log(data)
        const { result_id } = data;
        pollTaskStatus(result_id, fileName);
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
      {/* {data ? (
        <Button disabled={false} variant='outlined' onClick={exportToCsv}>
          Export to CSV
        </Button>
      ) : isError ? (
        <Button disabled={true} variant='outlined' onClick={exportToCsv}>
          ERROR: ${error}
        </Button>
      ) : isLoading ? (
        <Button disabled={true} variant='outlined' onClick={exportToCsv}>
          LOADING...
        </Button>
      ) : !Array.isArray(cells) && cells.length ? (
        <Button disabled={true} variant='outlined' onClick={exportToCsv}>
          Select a cell
        </Button>
      ) : (
        <Button disabled={true} variant='outlined' onClick={exportToCsv}>
          No data
        </Button>
      )} */}
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
