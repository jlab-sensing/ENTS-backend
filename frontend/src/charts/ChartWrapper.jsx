import { React, useEffect, useRef, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import { Box, ToggleButton, Tooltip, Menu, MenuItem, ListItemText } from '@mui/material';
import zoom from '../assets/zoom.svg';
import reset from '../assets/reset.svg';
import pan from '../assets/pan.svg';
import FullscreenExit from '../assets/minimize.svg';
import Fullscreen from '../assets/maximize.svg';
import zoomIn from '../assets/zoom-in.svg';
import zoomOut from '../assets/zoom-out.svg';
import downsample from '../assets/downsample.svg';
import downloadIcon from '../assets/download.svg';

import {
  Chart as ChartJS,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Tooltip as chartTooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-luxon';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Line } from 'react-chartjs-2';
import usePrevious from '../hooks/usePrevious';
ChartJS.register(LineController, LineElement, PointElement, LinearScale, chartTooltip, Legend, TimeScale, zoomPlugin);

//** Wrapper for chart functionality and state */
function ChartWrapper({ id, data, options, stream, onResampleChange }) {
  // Glow plugin to highlight the newest point
  const glowPlugin = useMemo(
    () => ({
      id: 'dashboardGlow',
      afterDatasetsDraw: (chart) => {
        if (!stream) return;
        
        const { ctx } = chart;
        const datasets = chart.data.datasets;
        
        // Apply glow effect to all datasets
        datasets.forEach((dataset, datasetIndex) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          if (!meta || !meta.dataset) return;
          
          // Draw line with soft shadow
          ctx.save();
          ctx.shadowBlur = 1;
          ctx.shadowColor = dataset.borderColor || 'rgba(0, 0, 0, 0.06)';
          meta.dataset.draw(ctx);
          ctx.restore();

          // Highlight the last point with radial gradient
          const lastEl = meta.data && meta.data[meta.data.length - 1];
          if (!lastEl) return;
          
          const { x, y } = lastEl.getProps(['x', 'y'], true);
          const radGrad = ctx.createRadialGradient(x, y, 0, x, y, 18);
          radGrad.addColorStop(0, `${dataset.borderColor || '#000000'}45`);
          radGrad.addColorStop(1, `${dataset.borderColor || '#000000'}00`);
          
          ctx.save();
          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(x, y, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Draw the actual point
          ctx.save();
          ctx.fillStyle = dataset.borderColor || '#000000';
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      },
    }),
    [stream],
  );

  // Pulse ring around latest point
  const pulsePlugin = useMemo(
    () => ({
      id: 'dashboardPulse',
      afterDatasetsDraw: (chart) => {
        if (!stream) return;
        
        const datasets = chart.data.datasets;
        
        // Apply pulse effect to all datasets
        datasets.forEach((dataset, datasetIndex) => {
          const meta = chart.getDatasetMeta(datasetIndex);
          if (!meta || !meta.data || !meta.data.length) return;
          
          const { ctx } = chart;
          const el = meta.data[meta.data.length - 1];
          const { x, y } = el.getProps(['x', 'y'], true);
          const t = Date.now();
          const r = 7 + 3 * (0.5 + 0.5 * Math.sin((t % 2000) / 2000 * Math.PI * 2));
          
          ctx.save();
          ctx.strokeStyle = `${dataset.borderColor || '#000000'}45`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        });
      },
    }),
    [stream],
  );
  const [resetSelected] = useState(false);
  const [zoomSelected, setZoomSelected] = useState(false);
  const [panSelected, setPanSelected] = useState(true);
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [resampleAnchor, setResampleAnchor] = useState(null);
  const [selectedResample, setSelectedResample] = useState('hour');
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
      // Disable animations when streaming
      animation: stream ? false : options.animation,
      animations: stream ? { x: { duration: 0 }, y: { duration: 0 } } : options.animations,
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
        // Add streaming plugins when streaming is ON
        ...(stream && { dashboardGlow: glowPlugin, dashboardPulse: pulsePlugin }),
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
    }
  };
  const handleZoomOut = () => {
    if (chartRef.current) {
      chartRef.current.zoom(0.9);
      setScaleRef(getScaleRef(chartRef.current));
    }
  };

  const handleResampleClick = (event) => {
    setResampleAnchor(event.currentTarget);
  };

  const handleResampleClose = () => {
    setResampleAnchor(null);
  };

  const handleResampleSelect = (value) => {
    setSelectedResample(value);
    handleResampleClose();
    // Trigger data refresh with new resample value
    if (onResampleChange) {
      onResampleChange(value);
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
  }, [zoomSelected, panSelected, prevScaleRef, scaleRef, data]);

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
        plugins={stream ? [glowPlugin, pulsePlugin] : []}
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
        
        {/* Show additional controls only when not streaming */}
        {!stream && (
          <>
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
              <ToggleButton value={false} variant='contained' onClick={handleResampleClick} sx={{ width: '32px', height: '32px' }}>
                <Box component='img' src={downsample} sx={{ width: '16px', height: '16px' }}></Box>
              </ToggleButton>
            </Tooltip>
            <Menu
              anchorEl={resampleAnchor}
              open={Boolean(resampleAnchor)}
              onClose={handleResampleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={() => handleResampleSelect('none')} selected={selectedResample === 'none'}>
                <ListItemText>None</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleResampleSelect('hour')} selected={selectedResample === 'hour'}>
                <ListItemText>Hourly</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleResampleSelect('day')} selected={selectedResample === 'day'}>
                <ListItemText>Daily</ListItemText>
              </MenuItem>
            </Menu>
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
              <ToggleButton value={false} onClick={handleExportChart} sx={{ width: '32px', height: '32px' }}>
                <Box component='img' src={downloadIcon} sx={{ width: '20px', height: '20px' }}></Box>
              </ToggleButton>
            </Tooltip>
          </>
        )}

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
                  plugins={stream ? [glowPlugin, pulsePlugin] : []}
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
                {/* Show additional controls only when not streaming */}
                {!stream && (
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
                )}
                {!stream && (
                  <>
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
                      <ToggleButton value={false} variant='contained' onClick={handleResampleClick}>
                        <Box component='img' src={downsample} sx={{ width: '20px', height: '20px' }}></Box>
                      </ToggleButton>
                    </Tooltip>
                    <Menu
                      anchorEl={resampleAnchor}
                      open={Boolean(resampleAnchor)}
                      onClose={handleResampleClose}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                    >
                      <MenuItem onClick={() => handleResampleSelect('none')} selected={selectedResample === 'none'}>
                        <ListItemText>None</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => handleResampleSelect('hour')} selected={selectedResample === 'hour'}>
                        <ListItemText>Hourly</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => handleResampleSelect('day')} selected={selectedResample === 'day'}>
                        <ListItemText>Daily</ListItemText>
                      </MenuItem>
                    </Menu>
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
                  </>
                )}

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
  onResampleChange: PropTypes.func,
};
