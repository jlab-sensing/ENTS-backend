import { React } from 'react';
import { Button } from '@mui/material';
import PropTypes from 'prop-types';
import { getCellData } from '../../../services/cell';

function DownloadBtn({ cells, startDate, endDate }) {
  const downloadFile = ({ data, fileName, fileType }) => {
    const blob = new Blob([data], { type: fileType });

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
  };
  /** 
    exports cell data from json obj to csv.
    runs with static number of headers
  **/
  const exportToCsv = (e) => {
    e.preventDefault();
    // Note: timestamp string slices of "Wed," in "Wed, 29 Jun 2022 14:00:00 GMT"
    for (const { id, name } of cells) {
      getCellData(id, startDate, endDate).then((data) => {
        console.log(data);
        downloadFile({
          data: [
            ['timestamp', 'Voltage (mV)', 'Current (uA)', 'Power (uW)', 'EC (uS/cm)', 'VWC (%)', 'Temperature (C)'],
            ...data.map((point) => [
              point.timestamp.slice(5), // to get rid of str day format
              point.v,
              point.i,
              point.p,
              point.ec,
              point.vwc,
              point.temp,
            ]),
          ]
            .map((e) => e.join(','))
            .join('\n'),
          fileName: name + '.csv',
          fileType: 'text/csv',
        });
      });
    }
  };
  return (
    <div className='DownloadBtn'>
      <Button disabled={false} variant='outlined' onClick={exportToCsv}>
        Export to CSV
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
