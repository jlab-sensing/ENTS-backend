import { React, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import { Box, ToggleButton, Tooltip } from '@mui/material';
import zoom from '../assets/zoom.svg';
import reset from '../assets/reset.svg';
import pan from '../assets/pan.svg';
import FullscreenExit from '../assets/minimize.svg';
import Fullscreen from '../assets/maximize.svg';
import zoomIn from '../assets/zoom-in.svg';
import zoomOut from '../assets/zoom-out.svg';
import downsample from '../assets/downsample.svg';
import downloadIcon from '../assets/download.svg';
import GetAppIcon from '@mui/icons-material/GetApp';

import {
  Chart as ChartJS,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Tooltip as chartTooltip,
  Legend,
  TimeScale,
  Decimation,
} from 'chart.js';
import 'chartjs-adapter-luxon';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Line } from 'react-chartjs-2';
import usePrevious from '../hooks/usePrevious';
ChartJS.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  chartTooltip,
  Legend,
  TimeScale,
  zoomPlugin,
  Decimation,
);

//** Wrapper for chart functionality and state */
function ChartWrapper({ id, data, options, stream }) {
  const [resetSelected] = useState(false);
  const [zoomSelected, setZoomSelected] = useState(false);
  const [panSelected, setPanSelected] = useState(true);
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [decimationSelected, setDecimationSelected] = useState(true);
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
  // NOTE: also defines the enable state of the plugins on rerenders
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
        decimation: {
          enabled: decimationSelected,
          algorithm: 'lttb',
          samples: 50,
          threshold: 50,
        },
      },
    };
  }

  let optionsWithPlugins = new Options();
  const chartRef = useRef(null);
  // const chartRef = useRef({ id, data, optionsWithPlugins });

  //** Modifies chart ref with new scales object */
  function setScales(scaleRef) {
    if (chartRef.current) {
      console.log(chartRef.current);
      for (const { axis, axisMin, axisMax } of axesWithScaleKeys) {
        if (chartRef.current.scales[axis]) {
          chartRef.current.scales[axis].options.min = scaleRef[axisMin];
          chartRef.current.scales[axis].options.max = scaleRef[axisMax];
        }
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
      chartRef.current.update();
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
  const handleZoomIn = () => {
    if (chartRef.current) {
      chartRef.current.zoom(1.1);
      setScaleRef(getScaleRef(chartRef.current));
      console.log('decimation is', chartRef.current.config.options.plugins.decimation);
    }
  };
  const handleZoomOut = () => {
    if (chartRef.current) {
      chartRef.current.zoom(0.9);
      setScaleRef(getScaleRef(chartRef.current));
    }
  };

  const handleDecimation = () => {
    if (chartRef.current) {
      chartRef.current.config.options.plugins.decimation = !decimationSelected;
      chartRef.current.update();
      setDecimationSelected(!decimationSelected);
    }
  };

  // const lineChart = () => {
  //   return <Line key={id} ref={chartRef} data={data} options={{ ...optionsWithPlugins, ...globalChartOpts }}></Line>;
  // };

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
  }, [zoomSelected, panSelected, prevScaleRef, scaleRef, decimationSelected]);

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
      console.log('zoom');
    }
    return;
    // TODO: refactor for better state management, useCallback for setting scaleRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scaleRef]);

  const handleExportChart = () => {
    if (chartRef.current) {
      const link = document.createElement('a');
      link.href = chartRef.current.toBase64Image();
      link.download = `chart-${id}-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    
    <Box
      sx={{
        display: 'flex',
        gap: '1%',
        height: '100%',
      }}
    >
      <Line
        data-testid='chart-container'
        key={id}
        ref={chartRef}
        data={data}
        options={{ ...optionsWithPlugins, ...globalChartOpts }}
      ></Line>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1%',
        }}
      >
        <Tooltip
          title='Reset'
          placement='bottom'
          disableInteractive
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, -11],
                  },
                },
              ],
            },
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
        </Tooltip>
        <Tooltip
          title='Zoom'
          placement='bottom'
          disableInteractive
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, -11],
                  },
                },
              ],
            },
          }}
        >
          <ToggleButton
            value={zoomSelected}
            selected={zoomSelected}
            onClick={handleToggleZoom}
            sx={{ width: '32px', height: '32px' }}
          >
            <Box component='img' src={zoom} sx={{ width: '16px', height: '16px' }}></Box>
          </ToggleButton>
        </Tooltip>
        <Tooltip
          title='Pan'
          placement='bottom'
          disableInteractive
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, -11],
                  },
                },
              ],
            },
          }}
        >
          <ToggleButton
            value={panSelected}
            selected={panSelected}
            onClick={handleTogglePan}
            sx={{ width: '32px', height: '32px' }}
          >
            <Box component='img' src={pan} sx={{ width: '16px', height: '16px' }}></Box>
          </ToggleButton>
        </Tooltip>
        <Tooltip
          title='Zoom In'
          placement='bottom'
          disableInteractive
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, -11],
                  },
                },
              ],
            },
          }}
        >
          <ToggleButton value={false} onClick={handleZoomIn} sx={{ width: '32px', height: '32px' }}>
            <Box component='img' src={zoomIn} sx={{ width: '16px', height: '16px' }}></Box>
          </ToggleButton>
        </Tooltip>
        <Tooltip
          title='Zoom Out'
          placement='bottom'
          disableInteractive
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, -11],
                  },
                },
              ],
            },
          }}
        >
          <ToggleButton
            value={false}
            variant='contained'
            onClick={handleZoomOut}
            sx={{ width: '32px', height: '32px' }}
          >
            <Box component='img' src={zoomOut} sx={{ width: '16px', height: '16px' }}></Box>
          </ToggleButton>
        </Tooltip>
        <Tooltip
          title='Downsample'
          placement='bottom'
          disableInteractive
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, -11],
                  },
                },
              ],
            },
          }}
        >
          <ToggleButton
            variant='contained'
            value={decimationSelected}
            selected={decimationSelected}
            onClick={handleDecimation}
            sx={{ width: '32px', height: '32px' }}
          >
            <Box component='img' src={downsample} sx={{ width: '16px', height: '16px' }}></Box>
          </ToggleButton>
        </Tooltip>
        
        {/* Export Chart button */}
        <Tooltip
          title='Export Chart'
          placement='bottom'
          disableInteractive
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, -11],
                  },
                },
              ],
            },
          }}
        >
          <ToggleButton 
            value={false} 
            onClick={handleExportChart} 
            sx={{ width: '32px', height: '32px' }}
          >
            <GetAppIcon sx={{ width: '16px', height: '16px' }} />
          </ToggleButton>
        </Tooltip>
        
        <Tooltip
          title='Fullscreen'
          placement='bottom'
          disableInteractive
          slotProps={{
            popper: {
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, -11],
                  },
                },
              ],
            },
          }}
        >
          <ToggleButton value={false} selected={false} onClick={handleOpen} sx={{ width: '32px', height: '32px' }}>
            <Box component='img' src={Fullscreen} sx={{ width: '16px', height: '16px' }}></Box>
          </ToggleButton>
        </Tooltip>
        <Modal data-testid='fullscreen-modal' open={open} onClose={handleClose} closeAfterTransition>
          <Fade in={open}>
            <Box
              sx={{
                position: 'absolute',
                bgcolor: 'white',
                display: 'flex',
                height: '100vh',
                width: '100vw',
              }}
            >
              <Box
                sx={{
                  width: '90%',
                  heigh: '100%',
                  py: '2.5%',
                  paddingLeft: '2.5%',
                }}
              >
                <Line
                  key={id}
                  ref={chartRef}
                  data={data}
                  options={{ ...optionsWithPlugins, ...globalChartOpts }}
                ></Line>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1%',
                  padding: '2.5%',
                }}
              >
                <Tooltip
                  title='Reset'
                  placement='bottom'
                  disableInteractive
                  slotProps={{
                    popper: {
                      modifiers: [
                        {
                          name: 'offset',
                          options: {
                            offset: [0, -11],
                          },
                        },
                      ],
                    },
                  }}
                >
                  <ToggleButton value={resetSelected} onClick={handleResetZoom} variant='outlined'>
                    <Box component='img' src={reset} sx={{ width: '20px', height: '20px' }}></Box>
                  </ToggleButton>
                </Tooltip>
                <Tooltip
                  title='Zoom'
                  placement='bottom'
                  disableInteractive
                  slotProps={{
                    popper: {
                      modifiers: [
                        {
                          name: 'offset',
                          options: {
                            offset: [0, -11],
                          },
                        },
                      ],
                    },
                  }}
                >
                  <ToggleButton value={zoomSelected} selected={zoomSelected} onClick={handleToggleZoom}>
                    <Box component='img' src={zoom} sx={{ width: '20px', height: '20px' }}></Box>
                  </ToggleButton>
                </Tooltip>
                <Tooltip
                  title='Pan'
                  placement='bottom'
                  disableInteractive
                  slotProps={{
                    popper: {
                      modifiers: [
                        {
                          name: 'offset',
                          options: {
                            offset: [0, -11],
                          },
                        },
                      ],
                    },
                  }}
                >
                  <ToggleButton value={panSelected} selected={panSelected} onClick={handleTogglePan}>
                    <Box component='img' src={pan} sx={{ width: '20px', height: '20px' }}></Box>
                  </ToggleButton>
                </Tooltip>
                <Tooltip
                  title='Zoom In'
                  placement='bottom'
                  disableInteractive
                  slotProps={{
                    popper: {
                      modifiers: [
                        {
                          name: 'offset',
                          options: {
                            offset: [0, -11],
                          },
                        },
                      ],
                    },
                  }}
                >
                  <ToggleButton value={false} onClick={handleZoomIn}>
                    <Box component='img' src={zoomIn} sx={{ width: '20px', height: '20px' }}></Box>
                  </ToggleButton>
                </Tooltip>
                <Tooltip
                  title='Zoom Out'
                  placement='bottom'
                  disableInteractive
                  slotProps={{
                    popper: {
                      modifiers: [
                        {
                          name: 'offset',
                          options: {
                            offset: [0, -11],
                          },
                        },
                      ],
                    },
                  }}
                >
                  <ToggleButton value={false} variant='contained' onClick={handleZoomOut}>
                    <Box component='img' src={zoomOut} sx={{ width: '20px', height: '20px' }}></Box>
                  </ToggleButton>
                </Tooltip>
                <Tooltip
                  title='Downsample'
                  placement='bottom'
                  disableInteractive
                  slotProps={{
                    popper: {
                      modifiers: [
                        {
                          name: 'offset',
                          options: {
                            offset: [0, -11],
                          },
                        },
                      ],
                    },
                  }}
                >
                  <ToggleButton
                    variant='contained'
                    value={decimationSelected}
                    selected={decimationSelected}
                    onClick={handleDecimation}
                  >
                    <Box component='img' src={downsample} sx={{ width: '20px', height: '20px' }}></Box>
                  </ToggleButton>
                </Tooltip>
                
                {/* Add Export button to fullscreen modal */}
                <Tooltip
                  title='Export Chart'
                  placement='bottom'
                  disableInteractive
                  slotProps={{
                    popper: {
                      modifiers: [
                        {
                          name: 'offset',
                          options: {
                            offset: [0, -11],
                          },
                        },
                      ],
                    },
                  }}
                >
                  <ToggleButton value={false} onClick={handleExportChart}>
                    <Box component='img' src={downloadIcon} sx={{ width: '20px', height: '20px' }}></Box>
                  </ToggleButton>
                </Tooltip>
                
                <Tooltip
                  title='Windowed'
                  placement='bottom'
                  disableInteractive
                  slotProps={{
                    popper: {
                      modifiers: [
                        {
                          name: 'offset',
                          options: {
                            offset: [0, -11],
                          },
                        },
                      ],
                    },
                  }}
                >
                  <ToggleButton value={false} selected={false} onClick={handleClose}>
                    <Box component='img' src={FullscreenExit} sx={{ width: '20px', height: '20px' }}></Box>
                  </ToggleButton>
                </Tooltip>
              </Box>
            </Box>
          </Fade>
        </Modal>
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
