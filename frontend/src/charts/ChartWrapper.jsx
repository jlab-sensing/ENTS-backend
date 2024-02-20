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
import usePrevious from '../hooks/usePrevious';

//** Wrapper for chart functionality and state */
function ChartWrapper({ id, data, options, stream }) {
  const [resetSelected] = useState(false);
  const [zoomSelected, setZoomSelected] = useState(false);
  const [panSelected, setPanSelected] = useState(true);
  const [scaleRef, setScaleRef] = useState({});
  const [prevData, setPrevData] = useState(data);
  const prevScaleRef = usePrevious(scaleRef);

  //** defines axis for charts, charts may have different axis names/
  const axes = Object.keys(options.scales);
  const axesWithScaleKeys = [];
  for (const a of axes) {
    axesWithScaleKeys.push({ axis: a, axisMin: `${a}Min`, axisMax: `${a}Max` });
  }

  //** Turns axes into scales object */
  function getScaleRef(chart) {
    const axesWithScale = axesWithScaleKeys.reduce(
      (ac, { axis, axisMin, axisMax }) => ({
        ...ac,
        [axisMin]: chart.scales[axis].options.min,
        [axisMax]: chart.scales[axis].options.max,
      }),
      {},
    );
    return axesWithScale;
  }

  //** Callback for when zoom action is completed */
  function onZoomComplete({ chart }) {
    setScaleRef(getScaleRef(chart));
  }

  //** Callback for when pan action is completed */
  function onPanComplete({ chart }) {
    setScaleRef(getScaleRef(chart));
  }

  //** Defines options object */
  function Options() {
    return {
      ...options,
      plugins: {
        zoom: {
          zoom: {
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
  const chartRef = useRef({ id, data, optionsWithPlugins });

  //** Modifies chart ref with new scales object */
  function setScales(scaleRef) {
    if (chartRef.current) {
      for (const { axis, axisMin, axisMax } of axesWithScaleKeys) {
        chartRef.current.scales[axis].options.min = scaleRef[axisMin];
        chartRef.current.scales[axis].options.max = scaleRef[axisMax];
      }
      chartRef.current.update();
    }
  }

  const globalChartOpts = {
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  //* Event Handlers */

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };
  const handleToggleZoom = () => {
    if (chartRef.current) {
      if (!zoomSelected === true) {
        chartRef.current.options.plugins.zoom.pan.enabled = false;
        setPanSelected(false);
      }
      chartRef.current.update();
      setZoomSelected(!zoomSelected);
    }
  };
  const handleTogglePan = () => {
    if (chartRef.current) {
      if (!panSelected === true) {
        chartRef.current.config.options.plugins.zoom.zoom.drag.enabled = false;
        setZoomSelected(false);
      }
      chartRef.current.update();
      setPanSelected(!panSelected);
    }
  };

  const lineChart = () => {
    return <Line key={id} ref={chartRef} data={data} options={{ ...optionsWithPlugins, ...globalChartOpts }}></Line>;
  };

  /** Maintain zoom and pan ref from previous render */
  useEffect(() => {
    if (chartRef.current) {
      if (prevScaleRef != undefined) {
        setScales(prevScaleRef);
        chartRef.current.update();
      } else if (scaleRef != undefined) {
        setScales(scaleRef);
      }
      return;
    }
    // TODO: refactor for better state management, useCallback for setting scaleRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomSelected, panSelected, prevScaleRef, scaleRef]);

  //** Maintain zoom and pan when streaming new data */
  useEffect(() => {
    if (JSON.stringify(prevData) != JSON.stringify(data)) {
      setPrevData(data);
      if (stream) {
        if (chartRef.current && chartRef.current.config.data != data) {
          chartRef.current.config.data.labels = data.labels;
          chartRef.current.config.data.datasets = data.datasets;
          chartRef.current.update();
          return;
        }
      } else {
        if (chartRef.current && chartRef.current.config.data != data) {
          chartRef.current.config.data.labels = data.labels;
          chartRef.current.config.data.datasets = data.datasets;
          if (prevScaleRef != undefined) {
            setScales(prevScaleRef);
            chartRef.current.update();
          } else if (scaleRef != undefined) {
            setScales(scaleRef);
            chartRef.current.update();
          }
          chartRef.current.update();
          return;
        }
      }
    }
    // TODO: refactor for better state management
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, scaleRef, prevScaleRef, stream]);

  /** Sets zoom / pan when state is updated onZoomComplete or onPanComplete */
  useEffect(() => {
    if (scaleRef != undefined) {
      setScales(scaleRef);
      chartRef.current.update();
    }
    return;
    // TODO: refactor for better state management, useCallback for setting scaleRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  stream: PropTypes.bool,
};
