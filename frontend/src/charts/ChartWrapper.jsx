import { React, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, ToggleButton } from '@mui/material';
import zoom from '../assets/zoom.svg';
import reset from '../assets/reset.svg';
import pan from '../assets/pan.svg';
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
import { chartPlugins } from './plugins';
import usePrevious from '../hooks/usePrevious';

function ChartWrapper({ id, data, options }) {
  const [resetSelected] = useState(false);
  const [zoomSelected, setZoomSelected] = useState(false);
  const [panSelected, setPanSelected] = useState(true);
  const [zoomRef, setZoomRef] = useState({});
  // let zoomLvl = 0;
  const prevZoomRef = usePrevious(zoomRef);

  function onZoomComplete({ chart }) {
    // console.log(chart);
    console.log('zoom changed', chart.getZoomLevel(), prevZoomRef);
    // zoomLvl = chart.getZoomLevel();
    setZoomRef({ min: chart.scales.x.options.min, max: chart.scales.x.options.max, lvl: chart.getZoomLevel() });
    console.log('scale min', chart.scales.x.options.min);
    console.log('scale max', chart.scales.x.options.max);
  }

  function Options() {
    return {
      ...options,
      plugins: {
        zoom: {
          zoom: {
            ...chartPlugins.zoom.zoom,
            onZoomComplete,
          },
        },
      },
    };
  }

  let optionsWithPlugins = new Options();
  // console.log('opt', optionsWithPlugins);
  const chartRef = useRef({ id, data, optionsWithPlugins });

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

  // Defines line chart to prevent rerendering
  const lineChart = () => {
    return (
      <Line
        key={id}
        ref={chartRef}
        data={data}
        options={{ ...optionsWithPlugins, ...globalChartOpts }}
        updateMode='active'
      ></Line>
    );
  };

  /**
   * Triggers on refresh to maintain different states of chart components. Fix for maintaining toggle for when chart refreshes
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (chartRef.current) {
      // setZoomLvl(chartRef.current.getZoomLevel());
      console.log(chartRef.current.options.plugins);
      setZoomSelected(chartRef.current.config.options.plugins.zoom.zoom.wheel.enabled);
      setPanSelected(chartRef.current.options.plugins.zoom.pan.enabled);
      // console.log('test', zoomRef);
      // chartRef.current.options.plugins.zoom.zoom.onZoomComplete = onZoomComplete(chartRef.current);
      // chartRef.current.zoom(zoomLvl);
      console.log(chartRef.current.options.plugins.zoom.zoom.onZoomComplete);
      // chartRef.current.update('none');
    }
  }, [zoomSelected, panSelected]);
  // setZoomLvl(usePrevious(zoomLvl));

  useEffect(() => {
    // console.log(data);
    if (chartRef.current && chartRef.current.config.data != data) {
      console.log(chartRef.current.config.data);
      chartRef.current.config.data.label = data.label;
      chartRef.current.config.data.datasets = data.datasets;
      // console.log('test', zoomLvl, prev);
      // chartRef.current.options.plugins.zoom.zoom.onZoomComplete = onZoomComplete(chartRef.current);
      // chartRef.current.zoom(zoomLvl)

      // maintain zoom after data changes, if exists
      if (prevZoomRef !== undefined) {
        // chartRef.current.zoom({ x: 1 });
        chartRef.current.scales.x.options.min = prevZoomRef.min;
        chartRef.current.scales.x.options.max = prevZoomRef.max;

        chartRef.current.update();
      }
      chartRef.current.update('none');
    }
  }, [data]);

  useEffect(() => {
    console.log('zoom', zoomRef);
    if (chartRef.current && zoomRef.min & zoomRef.max && zoomRef.lvl) {
      console.log('zoom', zoomRef);
      console.log('zoomlvl', zoomRef.lvl);
      console.log(chartRef.current);
      chartRef.current.zoom({ x: 1, mode: 'zoom' });
      chartRef.current.scales.x.options.min = zoomRef.min;
      chartRef.current.scales.x.options.max = zoomRef.max;

      chartRef.current.update('zoom');
    }
    return;
  }, [zoomRef]);

  return (
    <Box
      sx={{
        display: 'flex',
        gap: '1%',
        height: '100%',
      }}
    >
      {lineChart()}
      {/* <Line key={id} ref={chartRef} data={data} options={{ ...options, ...globalChartOpts }} redraw></Line>; */}
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
      </Box>
    </Box>
  );
}

export default ChartWrapper;

ChartWrapper.propTypes = {
  id: PropTypes.string,
  data: PropTypes.object,
  options: PropTypes.object,
};
