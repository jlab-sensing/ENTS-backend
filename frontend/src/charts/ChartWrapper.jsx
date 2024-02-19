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
  const [panRef, setPanRef] = useState({});
  const [scaleRef, setScaleRef] = useState({});
  // let zoomLvl = 0;
  const prevZoomRef = usePrevious(zoomRef);
  const prevPanRef = usePrevious(panRef);
  const prevScaleRef = usePrevious(scaleRef);
  const prevZoomSel = usePrevious(zoomSelected);
  const prevPanSel = usePrevious(panSelected);

  function onZoomComplete({ chart }) {
    // console.log(chart);
    console.log('zoom changed', chart.getZoomLevel(), prevZoomRef);
    // zoomLvl = chart.getZoomLevel();
    setScaleRef({
      xMin: chart.scales.x.options.min,
      xMax: chart.scales.x.options.max,
      yMin: chart.scales.y.options.min,
      yMax: chart.scales.y.options.max,
    });
    // setZoomRef({ min: chart.scales.x.options.min, max: chart.scales.x.options.max, lvl: chart.getZoomLevel() });
    console.log('z scale min', chart.scales.x.options.min);
    console.log('z scale max', chart.scales.x.options.max);
  }

  function onPanComplete({ chart }) {
    // console.log(chart);
    console.log('pan changed');
    // zoomLvl = chart.getZoomLevel();
    setScaleRef({
      xMin: chart.scales.x.options.min,
      xMax: chart.scales.x.options.max,
      yMin: chart.scales.y.options.min,
      yMax: chart.scales.y.options.max,
    });
    console.log('scale min', chart.scales.x.options.min);
    console.log('scale max', chart.scales.x.options.max);
  }

  function Options() {
    return {
      ...options,
      plugins: {
        zoom: {
          zoom: {
            // ...chartPlugins.zoom.zoom,
            drag: {
              enabled: zoomSelected,
            },
            mode: 'x',
            scaleMode: 'x',
            onZoomComplete,
          },
          pan: {
            enabled: panSelected,
            mode: 'xy',
            onPanComplete,
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
      // chartRef.current.config.options.plugins.zoom.zoom.drag.enabled = !zoomSelected;

      if (!zoomSelected === true) {
        console.log('turning off pan');
        chartRef.current.options.plugins.zoom.pan.enabled = false;
        setPanSelected(false);
      }
      chartRef.current.update();
      setZoomSelected(!zoomSelected);
    }
  };
  const handleTogglePan = () => {
    if (chartRef.current) {
      // console.log('pan', chartRef.current);
      // chartRef.current.config.options.plugins.zoom.pan.enabled = !panSelected;
      // console.log('pan', chartRef.current.config.options.plugins.zoom.pan.enabled);
      // console.log('pan', chartRef.current);
      if (!panSelected === true) {
        console.log('turning off zoom');
        chartRef.current.config.options.plugins.zoom.zoom.drag.enabled = false;
        console.log('pan', chartRef.current);
        setZoomSelected(false);
      }
      chartRef.current.update();
      // console.log('pan', chartRef.current);
      setPanSelected(!panSelected);
    }
  };

  // Defines line chart to prevent rerendering
  const lineChart = () => {
    return <Line key={id} ref={chartRef} data={data} options={{ ...optionsWithPlugins, ...globalChartOpts }}></Line>;
  };

  /**
   * Triggers on refresh to maintain different states of chart components. Fix for maintaining toggle for when chart refreshes
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps

  /** Maintain zoom and pan ref from previous render */
  useEffect(() => {
    if (chartRef.current) {
      // setZoomLvl(chartRef.current.getZoomLevel());
      // console.log(chartRef.current.options.plugins);
      if (
        prevScaleRef != undefined &&
        prevScaleRef.xMin &&
        prevScaleRef.xMax &&
        prevScaleRef.yMin &&
        prevScaleRef.yMax
      ) {
        console.log('preventing reset');
        chartRef.current.scales.x.options.min = prevScaleRef.xMin;
        chartRef.current.scales.x.options.max = prevScaleRef.xMax;
        chartRef.current.scales.y.options.min = prevScaleRef.yMin;
        chartRef.current.scales.y.options.max = prevScaleRef.yMax;
        chartRef.current.update();
      } else if (chartRef.current && scaleRef.xMin && scaleRef.xMax) {
        chartRef.current.scales.x.options.min = scaleRef.xMin;
        chartRef.current.scales.x.options.max = scaleRef.xMax;
        chartRef.current.update();
      }
      return;
    }
  }, [zoomSelected, panSelected]);

  useEffect(() => {
    // console.log(data);
    if (chartRef.current && chartRef.current.config.data != data) {
      console.log(chartRef.current.config.data);
      chartRef.current.config.data.label = data.label;
      chartRef.current.config.data.datasets = data.datasets;
      if (
        prevScaleRef != undefined &&
        prevScaleRef.xMin &&
        prevScaleRef.xMax &&
        prevScaleRef.yMin &&
        prevScaleRef.yMax
      ) {
        console.log('preventing reset');
        chartRef.current.scales.x.options.min = prevScaleRef.xMin;
        chartRef.current.scales.x.options.max = prevScaleRef.xMax;
        chartRef.current.scales.y.options.min = prevScaleRef.yMin;
        chartRef.current.scales.y.options.max = prevScaleRef.yMax;
        chartRef.current.update();
      } else if (chartRef.current && scaleRef.xMin && scaleRef.xMax) {
        chartRef.current.scales.x.options.min = scaleRef.xMin;
        chartRef.current.scales.x.options.max = scaleRef.xMax;
        chartRef.current.update();
      }
      chartRef.current.update('none');
      return;
    }
  }, [data]);

  useEffect(() => {
    console.log('zoom', zoomRef);
    console.log(scaleRef);
    if (chartRef.current && scaleRef.xMin && scaleRef.xMax && scaleRef.yMin && scaleRef.yMax) {
      console.log('zoomScaleRef');
      chartRef.current.scales.x.options.min = scaleRef.xMin;
      chartRef.current.scales.x.options.max = scaleRef.xMax;
      chartRef.current.scales.y.options.min = scaleRef.yMin;
      chartRef.current.scales.y.options.max = scaleRef.yMax;
      chartRef.current.update();
    } else if (chartRef.current && scaleRef.xMin && scaleRef.xMax) {
      chartRef.current.scales.x.options.min = scaleRef.xMin;
      chartRef.current.scales.x.options.max = scaleRef.xMax;
      chartRef.current.update();
    }
    return;
  }, [scaleRef]);

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
