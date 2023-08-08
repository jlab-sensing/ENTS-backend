import { React, useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-luxon';
import PropTypes from 'prop-types';
import { Box, ToggleButton } from '@mui/material';
import zoom from '../assets/zoom.svg';
import reset from '../assets/reset.svg';
import pan from '../assets/pan.svg';

function Chart(props) {
  const chartRef = useRef();
  const [zoomSelected, setZoomSelected] = useState(false);
  const [panSelected, setPanSelected] = useState(true);
  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };
  const handleToggleZoom = () => {
    if (chartRef.current) {
      chartRef.current.options.plugins.zoom.zoom.wheel.enabled =
        !chartRef.current.options.plugins.zoom.zoom.wheel.enabled;
      chartRef.current.update();
      setZoomSelected(!zoomSelected);
    }
  };
  const handleTogglePan = () => {
    if (chartRef.current) {
      chartRef.current.options.plugins.zoom.pan.enabled =
        !chartRef.current.options.plugins.zoom.pan.enabled;
      chartRef.current.update();
      setPanSelected(!panSelected);
    }
  };
  useEffect(() => {
    if (chartRef.current) {
      setZoomSelected(chartRef.current.options.plugins.zoom.zoom.wheel.enabled);
      setPanSelected(chartRef.current.options.plugins.zoom.pan.enabled);
    }
  });

  return (
    <Box
      sx={{
        display: 'flex',
        gap: '1%',
        height: '100%',
      }}
    >
      <Line ref={chartRef} data={props.data} options={props.options} />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1%',
        }}
      >
        <ToggleButton
          onClick={handleResetZoom}
          variant='outlined'
          sx={{ width: '32px', height: '32px' }}
        >
          <Box
            component='img'
            src={reset}
            sx={{ width: '16px', height: '16px' }}
          ></Box>
        </ToggleButton>
        <ToggleButton
          selected={zoomSelected}
          onClick={handleToggleZoom}
          sx={{ width: '32px', height: '32px' }}
        >
          <Box
            component='img'
            src={zoom}
            sx={{ width: '16px', height: '16px' }}
          ></Box>
        </ToggleButton>
        <ToggleButton
          selected={panSelected}
          onClick={handleTogglePan}
          sx={{ width: '32px', height: '32px' }}
        >
          <Box
            component='img'
            src={pan}
            sx={{ width: '16px', height: '16px' }}
          ></Box>
        </ToggleButton>
      </Box>
    </Box>
  );
}

export default Chart;

Chart.propTypes = {
  data: PropTypes.object,
  options: PropTypes.object,
};
