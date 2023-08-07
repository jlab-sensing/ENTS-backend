import { React } from 'react';
import { Button } from '@mui/material';
import PropTypes from 'prop-types';

function DownloadBtn(props) {
  const data = Object.values(props.data);
  const disabled = props.disabled;
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
    downloadFile({
      data: [
        [
          'timestamp',
          'Voltage (mV)',
          'Current (uA)',
          'Power (uW)',
          'EC (uS/cm)',
          'VWC (%)',
          'Temperature (C)',
        ],
        ...data.map((point) => [
          point.timestamp.slice(4),
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
      fileName: 'data.csv',
      fileType: 'text/csv',
    });
  };
  return (
    <div className='DownloadBtn'>
      <Button disabled={disabled} variant='outlined' onClick={exportToCsv}>
        Export to CSV
      </Button>
    </div>
  );
}

DownloadBtn.propTypes = {
  data: PropTypes.object,
  disabled: PropTypes.bool,
};

export default DownloadBtn;
