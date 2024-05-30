import { useEffect } from 'react';
import { Button } from '@mui/material';
import PropTypes from 'prop-types';
import { getCellData } from '../../../services/cell';
import { DateTime } from 'luxon';
import { useQuery, useQueryClient } from '@tanstack/react-query';

function DownloadBtn({ cells, startDate, endDate }) {
  // Get QueryClient from the context
  // const queryClient = useQueryClient()

  // useEffect(() => { queryClient.invalidateQueries({ queryKey: ['cells'] }) }, [cells, startDate, endDate, queryClient])


  // const { isLoading, isError, data, error, isFetching } =
  //   useQuery({
  //     queryKey: ['cells'],
  //     queryFn: () => getCellData(cells.map((c) => c.id), 'none', startDate, endDate),
  //     enabled: !!(Array.isArray(cells) && cells.length),
  //   refetchOnWindowFocus: false,
  //   })


  const downloadFile = () => {
    for (const { id, name } of cells) {
      const fileName = name + '.csv'
      const resample = 'none'
      getCellData(id, resample, startDate, endDate).then((data) => {
        const blob = data
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
      })
    }
  };
  /** 
    exports cell data from json obj to csv.
    runs with static number of headers
  **/
  const exportToCsv = (e) => {
    downloadFile();
  //   e.preventDefault();
  //   // Note: timestamp string slices of "Wed," in "Wed, 29 Jun 2022 14:00:00 GMT"
  //   const resample = 'none';
  //   for (const { id, name } of cells) {
  //     getCellData(id, resample, startDate, endDate).then((data) => {
  //       downloadFile({
  //         data: [
  //           [
  //             'timestamp',
  //             'Voltage (mV)',
  //             'Current (uA)',
  //             'Power (uW)',
  //             'EC (uS/cm)',
  //             'VWC (%)',
  //             'Raw VWC',
  //             'Temperature (C)',
  //             'leaf_voltage (V)',
  //           ],
  //           ...data.map((point) => [
  //             // point.timestamp,
  //             DateTime.fromHTTP(point.timestamp.slice()), // to get rid of str day format
  //             point.v,
  //             point.i,
  //             point.p,
  //             point.ec,
  //             point.vwc,
  //             point.raw_vwc,
  //             point.temp,
  //             point.data,
  //           ]),
  //         ]
  //           .map((e) => e.join(','))
  //           .join('\n'),
  //         fileName: name + '.csv',
  //         fileType: 'text/csv',
  //       });
  //     });
  //   }
  };
  return (
    <div className='DownloadBtn'>
      {/* {data ? (
        <Button disabled={false} variant='outlined' onClick={exportToCsv}>Export to CSV
        </Button>
      ) : isError ? (
        <Button disabled={true} variant='outlined' onClick={exportToCsv}>ERROR: ${error}
        </Button>
      ) : isLoading || isFetching ? (
        <Button disabled={true} variant='outlined' onClick={exportToCsv}>LOADING...
        </Button>
      ) : (!Array.isArray(cells) && cells.length) ? (
        <Button disabled={true} variant='outlined' onClick={exportToCsv}>Select a cell
        </Button>
      ) : (
        <Button disabled={true} variant='outlined' onClick={exportToCsv}>No data
        </Button>
      )} */}
        <Button disabled={false} variant='outlined' onClick={exportToCsv}>Export to CSV
        </Button>
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
