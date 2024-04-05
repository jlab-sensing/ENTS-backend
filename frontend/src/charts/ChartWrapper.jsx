import { React, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, ToggleButton } from '@mui/material';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import zoom from '../assets/zoom.svg';
import reset from '../assets/reset.svg';
import pan from '../assets/pan.svg';
import FullscreenExit from '../assets/minimize.svg';
import Fullscreen from '../assets/maximize.svg';
import {
  Chart as ChartJS,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-luxon';
import zoomPlugin from 'chartjs-plugin-zoom';
ChartJS.register(LineController, LineElement, PointElement, LinearScale, Tooltip, Legend, TimeScale, zoomPlugin);
import { Line } from 'react-chartjs-2';

function ChartWrapper(props) {
  const [resetSelected] = useState(false);
  const [zoomSelected, setZoomSelected] = useState(false);
  const [panSelected, setPanSelected] = useState(true);
  const [fullSelected, setFullSelected] = useState(false);
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);


  const chartRef = useRef();
  const globalChartOpts = {
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };
  const handleToggleZoom = () => {
    if (chartRef.current) {
      chartRef.current.config.options.plugins.zoom.zoom.wheel.enabled =
        !chartRef.current.config.options.plugins.zoom.zoom.wheel.enabled;
      chartRef.current.update();
      setZoomSelected(!zoomSelected);
    }
  };
  const handleTogglePan = () => {
    if (chartRef.current) {
      chartRef.current.options.plugins.zoom.pan.enabled = !chartRef.current.options.plugins.zoom.pan.enabled;
      chartRef.current.update();
      setPanSelected(!panSelected);
    }
  };

  const lineChart = () => {
    return <Line key={props.id} ref={chartRef} data={props.data} options={{ ...props.options, ...globalChartOpts, maintainAspectRatio: false }}></Line>;
  };

  /**
   * Triggers on refresh to maintain different states of chart components. Fix for maintaining toggle for when chart refreshes
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (chartRef.current) {
      setZoomSelected(chartRef.current.config.options.plugins.zoom.zoom.wheel.enabled);
      setPanSelected(chartRef.current.options.plugins.zoom.pan.enabled);
    }
  });

  return (
    <>  
    <Box
      sx={{
        display: 'flex',
        gap: '1%',
        height: '100%',
      }}
    >
      {lineChart()}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1%',
        }}
      >
        <ToggleButton
          value={resetSelected}
          onClick={handleResetZoom}
          variant='outlined'
          sx={{ width: '32px', height: '32px' }}
        >
          <Box component='img' src={reset} sx={{ width: '16px', height: '16px' }}></Box>
        </ToggleButton>
        <ToggleButton
          value={zoomSelected}
          selected={zoomSelected}
          onClick={handleToggleZoom}
          sx={{ width: '32px', height: '32px' }}
        >
          <Box component='img' src={zoom} sx={{ width: '16px', height: '16px' }}></Box>
        </ToggleButton>
        <ToggleButton
          value={panSelected}
          selected={panSelected}
          onClick={handleTogglePan}
          sx={{ width: '32px', height: '32px' }}
        >
          <Box component='img' src={pan} sx={{ width: '16px', height: '16px' }}></Box>
        </ToggleButton>
        <ToggleButton
          value={fullSelected}
          selected={fullSelected}
          onClick={handleOpen}
          sx={{ width: '32px', height: '32px' }}
        >
          <Box component='img' src={Fullscreen} sx={{ width: '16px', height: '16px' }}></Box>
        </ToggleButton>
      </Box>
    </Box>
        <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      >
        <Fade in={open}>

        <Box 
      sx={{
        position: 'absolute',
        bgcolor : "white",
        display: 'flex',
        height: '100vh',
        width: '100vw'
      }}
    >
      <Box
          sx={{
            width: '90%',
            heigh: '100%'
          }}>
          
        {lineChart()}  
       </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1%',
          padding: '2.5%'
        }}
      >
        <ToggleButton
          value={resetSelected}
          onClick={handleResetZoom}
          variant='outlined'
        >
          <Box component='img' src={reset} sx={{ width: '20px', height: '20px' }}></Box>
        </ToggleButton>
        <ToggleButton
          value={zoomSelected}
          selected={zoomSelected}
          onClick={handleToggleZoom}
        >
          <Box component='img' src={zoom} sx={{ width: '22px', height: '22px' }}></Box>
        </ToggleButton>
        <ToggleButton
          value={panSelected}
          selected={panSelected}
          onClick={handleTogglePan}
        >
          <Box component='img' src={pan} sx={{ width: '20px', height: '20px' }}></Box>
        </ToggleButton>
        <ToggleButton
          value={false}
          selected={false}
          onClick={handleClose}
        >
          <Box component='img' src={FullscreenExit} sx={{ width: '20px', height: '20px' }}></Box>
        </ToggleButton>
      </Box>
    </Box>
    </Fade>
      </Modal>
      </>
  );
}

export default ChartWrapper;

ChartWrapper.propTypes = {
  id: PropTypes.string,
  data: PropTypes.object,
  options: PropTypes.object,
};
