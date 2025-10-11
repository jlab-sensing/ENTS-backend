import { Box, Divider, Grid, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { DateTime } from 'luxon';
import { React, useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
// import DateRangeNotification from '../../components/DateRangeNotification';
// import { useSmartDateRange } from '../../hooks/useSmartDateRange';
import useAxiosPrivate from '../../auth/hooks/useAxiosPrivate';
import { useCells } from '../../services/cell';
import ArchiveModal from './components/ArchiveModal';
import BackBtn from './components/BackBtn';
import CellSelect from './components/CellSelect';
import DateRangeSel from './components/DateRangeSel';
import DownloadBtn from './components/DownloadBtn';
import PowerCharts from './components/PowerCharts';
import StreamToggle from './components/StreamToggle';
import TerosCharts from './components/TerosCharts';
import UnifiedChart from './components/UnifiedChart';
import { io } from 'socket.io-client';

function Dashboard() {
  const axiosPrivate = useAxiosPrivate();
  const [startDate, setStartDate] = useState(DateTime.now().minus({ days: 14 }));
  const [endDate, setEndDate] = useState(DateTime.now());
  const [dBtnDisabled, setDBtnDisabled] = useState(true);
  const [selectedCells, setSelectedCells] = useState([]);
  const [stream, setStream] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showNoDataMessage, setShowNoDataMessage] = useState(false);
  const [manualDateSelection, setManualDateSelection] = useState(false);
  const [smartDateRangeApplied, setSmartDateRangeApplied] = useState(false); // eslint-disable-line no-unused-vars
  const [powerHasData, setPowerHasData] = useState(false);
  const [terosHasData, setTerosHasData] = useState(false);
  const [liveData, setLiveData] = useState([]);
  
  // Background streaming data - always collecting in background
  const backgroundStreamDataRef = useRef([]);
  
  // Timeout
  const clearTimeoutIdRef = useRef(null);
  
  const processingRef = useRef(false);
  const socketRef = useRef(null);
  
  // Streaming
  
  const [hourlyStartDate, setHourlyStartDate] = useState(DateTime.now().minus({ days: 14 }));
  const [hourlyEndDate, setHourlyEndDate] = useState(DateTime.now());


  // Mobile responsive detection
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // <768px = mobile

  const cells = useCells();
  const [searchParams, setSearchParams] = useSearchParams();

  // data processing
  const processLiveData = useCallback((measurements) => {
    if (!measurements || measurements.length === 0) return;

    const processed = {
      power: { byCell: {}, allMeasurements: [] },
      teros: { byCell: {}, allMeasurements: [] },
      sensors: { byType: {}, allMeasurements: [] }
    };

    // Process measurements
    measurements.forEach(measurement => {
      const { type, cellId } = measurement;
      
      // Group by sensor type and cell
      if (type === 'power') {
        if (!processed.power.byCell[cellId]) {
          processed.power.byCell[cellId] = [];
        }
        processed.power.byCell[cellId].push(measurement);
        processed.power.allMeasurements.push(measurement);
      } else if (type === 'teros12') {
        if (!processed.teros.byCell[cellId]) {
          processed.teros.byCell[cellId] = [];
        }
        processed.teros.byCell[cellId].push(measurement);
        processed.teros.allMeasurements.push(measurement);
      } else {
        if (!processed.sensors.byType[type]) {
          processed.sensors.byType[type] = { byCell: {} };
        }
        if (!processed.sensors.byType[type].byCell[cellId]) {
          processed.sensors.byType[type].byCell[cellId] = [];
        }
        processed.sensors.byType[type].byCell[cellId].push(measurement);
        processed.sensors.allMeasurements.push(measurement);
      }
    });

    // Sort measurements by timestamp for each group
    Object.keys(processed.power.byCell).forEach(cellId => {
      processed.power.byCell[cellId].sort((a, b) => a.timestamp - b.timestamp);
    });
    Object.keys(processed.teros.byCell).forEach(cellId => {
      processed.teros.byCell[cellId].sort((a, b) => a.timestamp - b.timestamp);
    });
    Object.keys(processed.sensors.byType).forEach(type => {
      Object.keys(processed.sensors.byType[type].byCell).forEach(cellId => {
        processed.sensors.byType[type].byCell[cellId].sort((a, b) => a.timestamp - b.timestamp);
      });
    });

    return processed;
  }, []);

  // Initialize timeouts when streaming starts
  const initializeStreamingTimeouts = useCallback(() => {
    // Clear existing timeouts
    if (clearTimeoutIdRef.current) {
      clearTimeout(clearTimeoutIdRef.current);
    }

    // Set timeout to clear charts after 30 minutes of no data
    const clearTimeoutId = setTimeout(() => {
      setLiveData([]);
      backgroundStreamDataRef.current = [];
      setPowerHasData(false);
      setTerosHasData(false);
    }, 30 * 60 * 1000);
    clearTimeoutIdRef.current = clearTimeoutId;
  }, []);

  // Memoized processed data
  const processedLiveData = useMemo(() => {
    if (!liveData || liveData.length === 0) {
      return {
        power: { byCell: {}, allMeasurements: [] },
        teros: { byCell: {}, allMeasurements: [] },
        sensors: { byType: {}, allMeasurements: [] }
      };
    }
    return processLiveData(liveData);
  }, [liveData, processLiveData]);

  // processing for WebSocket updates
  const processImmediateUpdate = useCallback((data) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      // Always collect data in background
      backgroundStreamDataRef.current = [
        ...backgroundStreamDataRef.current,
        { ...data, receivedAt: new Date().toISOString() }
      ].slice(-200);

      // Update live data if streaming
      if (stream) {
        setLiveData(prevData => {
          const newData = [...prevData, {
            ...data,
            receivedAt: new Date().toISOString()
          }];
          return newData.slice(-100);
        });

        // Clear existing timeout
        if (clearTimeoutIdRef.current) {
          clearTimeout(clearTimeoutIdRef.current);
        }

        // Reset timeout when new data arrives
        initializeStreamingTimeouts();
      }
    } finally {
      processingRef.current = false;
    }
  }, [stream, initializeStreamingTimeouts]);

  useEffect(() => {
    // Auto-detect local development: uses localhost if running on localhost, otherwise production
    const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const backendUrl = isLocalDev ? 'http://localhost:8000' : 'https://dirtviz.jlab.ucsc.edu';
    
    const socket = io(backendUrl, {
      transports: ['websocket'],
      upgrade: false,
      timeout: 20000,
      forceNew: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (selectedCells.length > 0) {
        const cellIds = selectedCells.map(cell => cell.id);
        socket.emit('subscribe_cells', { cellIds });
      }
    });

    socket.on('disconnect', () => {});
    socket.on('measurement_received', (data) => {
      processImmediateUpdate(data);
    });
    socket.on('connect_error', () => {});

    return () => {
      socket.disconnect();
      socketRef.current = null;
      if (clearTimeoutIdRef.current) {
        clearTimeout(clearTimeoutIdRef.current);
      }
    };
  }, [stream, processImmediateUpdate, selectedCells]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) return;

    if (selectedCells.length > 0) {
      const cellIds = selectedCells.map(cell => cell.id);
      socket.emit('subscribe_cells', { cellIds });
    }
  }, [selectedCells]);

  // Smart date range functionality
  // const {
  //   calculateSmartDateRange,
  //   showFallbackNotification,
  //   fallbackDates,
  //   showFallbackNotificationHandler,
  //   hideFallbackNotification,
  // } = useSmartDateRange();
  // Initialize state from URL parameters
  useEffect(() => {
    if (!cells.data) return;

    const searchQueryCells = searchParams.get('cell_id');
    const searchQueryStartDate = searchParams.get('startDate');
    const searchQueryEndDate = searchParams.get('endDate');

    if (searchQueryCells && searchQueryCells.length > 0) {
      const selectedCellIds = searchQueryCells.split(',');
      const selectedCells = cells.data.filter((cell) => selectedCellIds.includes(cell.id.toString()));
      setSelectedCells(selectedCells);
    }

    // Only treat URL dates as manual if they're different from the default dates
    if (searchQueryStartDate && searchQueryEndDate) {
      const parsedStartDate = DateTime.fromISO(searchQueryStartDate);

      const parsedEndDate = DateTime.fromISO(searchQueryEndDate);
      const defaultStart = DateTime.now().minus({ days: 14 });
      const defaultEnd = DateTime.now();

      // Check if URL dates are significantly different from defaults (more than 1 hour difference)
      const isManualSelection =
        Math.abs(parsedStartDate.diff(defaultStart, 'hours').hours) > 3 ||
        Math.abs(parsedEndDate.diff(defaultEnd, 'hours').hours) > 3;

      setStartDate(parsedStartDate);
      setEndDate(parsedEndDate);

      // Only block smart date range if this appears to be a genuine manual selection
      if (isManualSelection && searchQueryCells) {
        setManualDateSelection(true);
      }
    }

    setIsInitialized(true);
  }, [searchParams, cells.data]);

  // // Apply smart date range when cells are selected (only if not manual selection and not already applied)
  // useEffect(() => {
  //   if (!isInitialized || manualDateSelection || smartDateRangeApplied) return;

  //   const applySmartDateRange = async () => {
  //     if (selectedCells.length > 0) {
  //       try {
  //         const {
  //           startDate: smartStartDate,
  //           endDate: smartEndDate,
  //           isFallback,
  //         } = await calculateSmartDateRange(selectedCells);

  //         setStartDate(smartStartDate);
  //         setEndDate(smartEndDate);
  //         setSmartDateRangeApplied(true);

  //         if (isFallback) {
  //           showFallbackNotificationHandler();
  //         }
  //       } catch (error) {
  //         console.error('Error applying smart date range:', error);
  //         // Keep default dates on error
  //       }
  //     }
  //   };

  //   applySmartDateRange();
  // }, [selectedCells.map((cell) => cell.id).join(','), isInitialized, manualDateSelection, smartDateRangeApplied]);

  // Sync state changes to URL
  useEffect(() => {
    if (!isInitialized) return;

    const newParams = new URLSearchParams();

    if (selectedCells.length > 0) {
      newParams.set('cell_id', selectedCells.map((cell) => cell.id).join(','));
    }

    newParams.set('startDate', startDate.toISO());
    newParams.set('endDate', endDate.toISO());

    setSearchParams(newParams, { replace: true });
  }, [startDate, endDate, selectedCells, isInitialized, setSearchParams]);

  const handleStartDateChange = (newStartDate) => {
    if (stream) {
      setStartDate(newStartDate);
    } else {
      setHourlyStartDate(newStartDate);
    }
    setManualDateSelection(true);
    //setSmartDateRangeApplied(true); // Prevent smart range from overriding manual selection
  };

  const handleEndDateChange = (newEndDate) => {
    if (stream) {
      setEndDate(newEndDate);
    } else {
      setHourlyEndDate(newEndDate);
    }
    setManualDateSelection(true);
    // setSmartDateRangeApplied(true); // Prevent smart range from overriding manual selection
  };

  // Handle switching between streaming and hourly modes
  const handleStreamToggle = (newStreamMode) => {
    setStream(newStreamMode);
    if (newStreamMode) {
      setLiveData([...backgroundStreamDataRef.current]);
      
      // Initialize timeouts when streaming starts
      initializeStreamingTimeouts();
      
      setStartDate(hourlyStartDate);
      setEndDate(hourlyEndDate);
    } else {
      setLiveData([]);
      
      if (clearTimeoutIdRef.current) {
        clearTimeout(clearTimeoutIdRef.current);
        clearTimeoutIdRef.current = null;
      }
      
      setStartDate(hourlyStartDate);
      setEndDate(hourlyEndDate);
    }
  };

  // Handle cell selection changes
  const handleCellSelectionChange = (newSelectedCells) => {
    setSelectedCells(newSelectedCells);
    // Reset smart date range state when cells change to allow re-application
    if (!manualDateSelection) {
      setTimeout(() => {
        //setSmartDateRangeApplied(false);
      }, 100);
    }
  };

  useEffect(() => {
    if (selectedCells.length === 0) {
      setShowNoDataMessage(false);
      return;
    }

    setShowNoDataMessage(false);

    const checkForCharts = () => {
      const chartContainers = document.querySelectorAll('canvas');
      const hasVisibleCharts = chartContainers.length > 0;
      setShowNoDataMessage(!hasVisibleCharts);
    };

    const timer1 = setTimeout(checkForCharts, 500);
    const timer2 = setTimeout(checkForCharts, 1500);
    const timer3 = setTimeout(checkForCharts, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [selectedCells, startDate, endDate, stream]);

  // Check if top section should be hidden
  const topSectionHasData = powerHasData || terosHasData;

  return (
    <>
      <Box>
        {/* <DateRangeNotification
          open={showFallbackNotification}
          onClose={hideFallbackNotification}
          fallbackStartDate={fallbackDates.start}
          fallbackEndDate={fallbackDates.end}
        /> */}
        <Stack
          direction='column'
          divider={<Divider orientation='horizontal' flexItem />}
          justifyContent='spaced-evently'
          sx={{ minHeight: '100vh', boxSizing: 'border-box' }}
        >
          {/* Responsive Header - Mobile vs Desktop Layout */}
          {isMobile ? (
            // Mobile layout - Two bars for better mobile UX
            <Box sx={{ px: 3, py: 2 }}>
              <Stack spacing={2}>
                {/* First bar: Navigation + Cell Selection */}
                <Stack direction='row' spacing={2} alignItems='center'>
                  <BackBtn />
                  <Box sx={{ flexGrow: 1 }}>
                    <CellSelect
                      selectedCells={selectedCells}
                      setSelectedCells={handleCellSelectionChange}
                      axiosPrivate={axiosPrivate}
                    />
                  </Box>
                </Stack>

                {/* Second bar: Date Range + Controls */}
                <Stack direction='row' spacing={2} alignItems='center' justifyContent='space-between'>
                  {!stream && (
                      <DateRangeSel
                        startDate={hourlyStartDate}
                        endDate={hourlyEndDate}
                        setStartDate={handleStartDateChange}
                        setEndDate={handleEndDateChange}
                      />
                  )}
                  {stream && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%',
                          backgroundColor: 'success.main',
                        }} />
                      <Typography variant="body2" color="text.secondary">
                        Live
                        </Typography>
                    </Box>
                  )}
                  <Box sx={{ flexGrow: 1 }} /> {/* Spacer to push toggle to right */}
                  <Stack direction='row' spacing={1} alignItems='center'>
                    {!stream && !cells.isLoading && !cells.isError && <ArchiveModal cells={cells} />}
                    {!stream && (
                    <DownloadBtn
                      disabled={dBtnDisabled}
                      setDBtnDisabled={setDBtnDisabled}
                      cells={selectedCells}
                      startDate={hourlyStartDate}
                      endDate={hourlyEndDate}
                    />
                    )}
                    <StreamToggle 
                      isStreaming={stream} 
                      onToggle={handleStreamToggle} 
                    />
                  </Stack>
                </Stack>
              </Stack>
            </Box>
          ) : (
            // Desktop layout - Single bar (original layout preserved)
            <Stack direction='row' alignItems='center' sx={{ p: 2 }} spacing={3}>
              <BackBtn />
              <Box sx={{ flexGrow: 1, maxWidth: '30%' }}>
                <CellSelect
                  selectedCells={selectedCells}
                  setSelectedCells={handleCellSelectionChange}
                  axiosPrivate={axiosPrivate}
                />
              </Box>
              <Box display='flex' justifyContent='center' alignItems='center'>
                {!stream ? (
                    <DateRangeSel
                      startDate={hourlyStartDate}
                      endDate={hourlyEndDate}
                      setStartDate={handleStartDateChange}
                      setEndDate={handleEndDateChange}
                    />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%',
                      backgroundColor: 'success.main',
                    }} />
                  <Typography variant="body2" color="text.secondary">
                    Live
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ flexGrow: 1 }} /> {/* Spacer to push controls to right */}
              <Stack direction='row' spacing={1} alignItems='center'>
                {!stream && (!cells.isLoading && !cells.isError ? <ArchiveModal cells={cells} /> : <span />)}
                {!stream && (
              <DownloadBtn
                disabled={dBtnDisabled}
                setDBtnDisabled={setDBtnDisabled}
                cells={selectedCells}
                startDate={hourlyStartDate}
                endDate={hourlyEndDate}
              />
                )}
                <StreamToggle 
                  isStreaming={stream} 
                  onToggle={handleStreamToggle} 
                />
              </Stack>
            </Stack>
          )}
          {selectedCells.length === 0 ? (
            <Box display='flex' justifyContent='center' alignItems='center' sx={{ minHeight: 'calc(100vh - 120px)' }}>
              <Box textAlign='center'>
                <Typography variant='h4' color='primary' gutterBottom>
                  Welcome to ENTS Dashboard
                </Typography>
                <Typography variant='h6' color='text.secondary'>
                  Please select one or more cells above to view environmental sensor data
                </Typography>
              </Box>
            </Box>
          ) : showNoDataMessage ? (
            <Box display='flex' justifyContent='center' alignItems='center' sx={{ minHeight: 'calc(100vh - 120px)' }}>
              <Box textAlign='center'>
                <Typography variant='body1' color='text.secondary'>
                  No data available for the selected cells and date range
                </Typography>
              </Box>
            </Box>
          ) : (
            <>
              {/* Top section charts - always render but conditionally display */}
              <Grid
                container
                spacing={3}
                sx={{
                  width: '100%',
                  p: topSectionHasData ? 2 : 0,
                  height: topSectionHasData ? 'auto' : '0px',
                  overflow: 'hidden',
                }}
                alignItems='center'
                justifyContent='space-evenly'
                columns={{ xs: 4, sm: 8, md: 12 }}
              >
                <PowerCharts
                  cells={selectedCells}
                  {...(!stream && { startDate: hourlyStartDate, endDate: hourlyEndDate })}
                  stream={stream}
                  liveData={liveData}
                  processedData={processedLiveData.power}
                  onDataStatusChange={setPowerHasData}
                />
                <TerosCharts
                  cells={selectedCells}
                  {...(!stream && { startDate: hourlyStartDate, endDate: hourlyEndDate })}
                  stream={stream}
                  liveData={liveData}
                  processedData={processedLiveData.teros}
                  onDataStatusChange={setTerosHasData}
                />
              </Grid>

         
              {/* Bottom section charts - always rendered */}
              <Stack
                direction='column'
                divider={<Divider orientation='horizontal' flexItem />}
                justifyContent='spaced-evently'
                sx={{ width: '95%', boxSizing: 'border-box' }}
              >
                <UnifiedChart
                  type='soilPot'
                  cells={selectedCells}
                  startDate={hourlyStartDate}
                  endDate={hourlyEndDate}
                  stream={stream}
                  liveData={liveData}
                  processedData={processedLiveData.sensors}
                />
                <UnifiedChart
                  type='presHum'
                  cells={selectedCells}
                  startDate={hourlyStartDate}
                  endDate={hourlyEndDate}
                  stream={stream}
                  liveData={liveData}
                  processedData={processedLiveData.sensors}
                />
                <UnifiedChart
                  type='sensor'
                  cells={selectedCells}
                  startDate={hourlyStartDate}
                  endDate={hourlyEndDate}
                  stream={stream}
                  liveData={liveData}
                  processedData={processedLiveData.sensors}
                />
                <UnifiedChart
                  type='co2'
                  cells={selectedCells}
                  startDate={hourlyStartDate}
                  endDate={hourlyEndDate}
                  stream={stream}
                  liveData={liveData}
                  processedData={processedLiveData.sensors}
                />
                <UnifiedChart
                  type='temperature'
                  cells={selectedCells}
                  startDate={hourlyStartDate}
                  endDate={hourlyEndDate}
                  stream={stream}
                  liveData={liveData}
                  processedData={processedLiveData.sensors}
                />

                {/* New charts from main branch */}
                <UnifiedChart
                  type='soilHum'
                  cells={selectedCells}
                  startDate={hourlyStartDate}
                  endDate={hourlyEndDate}
                  stream={stream}
                  liveData={liveData}
                  processedData={processedLiveData.sensors}
                />
                <UnifiedChart
                  type='waterPress'
                  cells={selectedCells}
                  startDate={hourlyStartDate}
                  endDate={hourlyEndDate}
                  stream={stream}
                  liveData={liveData}
                  processedData={processedLiveData.sensors}
                />
                <UnifiedChart
                  type='waterFlow'
                  cells={selectedCells}
                  startDate={hourlyStartDate}
                  endDate={hourlyEndDate}
                  stream={stream}
                  liveData={liveData}
                  processedData={processedLiveData.sensors}
                />
              </Stack>
            </>
          )}
        </Stack>

        {/* 
        TODO: Alternative layout structure from main branch - currently commented out
        to preserve conditional rendering functionality. This structure has better spacing
        and responsive design but doesn't include conditional rendering callbacks.
        
        <Divider sx={{ backgroundColor: '#e0e0e0' }} />

        <Stack
          direction='column'
          divider={<Divider orientation='horizontal' flexItem />}
          justifyContent='space-evenly'
          spacing={4}
          sx={{
            width: '100%',
            boxSizing: 'border-box',
            py: 3,
            px: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Box sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
            <Grid container spacing={3} columns={{ xs: 4, sm: 8, md: 12 }}>
              <PowerCharts 
                cells={selectedCells} 
                {...(!stream && { startDate, endDate })}
                stream={stream} 
                liveData={liveData} 
              />
              <TerosCharts 
                cells={selectedCells} 
                {...(!stream && { startDate, endDate })}
                stream={stream} 
                liveData={liveData} 
              />
            </Grid>
          </Box>
          <Box sx={{ py: 2, px: { xs: 2, sm: 3, md: 4 } }}>
            <UnifiedChart type="soilPot" cells={selectedCells} {...(!stream && { startDate, endDate })} stream={stream} liveData={liveData} />
          </Box>
          <Box sx={{ py: 2, px: { xs: 2, sm: 3, md: 4 } }}>
            <UnifiedChart type="presHum" cells={selectedCells} {...(!stream && { startDate, endDate })} stream={stream} liveData={liveData} />
          </Box>
          <Box sx={{ py: 2, px: { xs: 2, sm: 3, md: 4 } }}>
            <UnifiedChart type="sensor" cells={selectedCells} {...(!stream && { startDate, endDate })} stream={stream} liveData={liveData} />
          </Box>
          <Box sx={{ py: 2, px: { xs: 2, sm: 3, md: 4 } }}>
            <UnifiedChart type="co2" cells={selectedCells} {...(!stream && { startDate, endDate })} stream={stream} liveData={liveData} />
          </Box>
          <Box sx={{ py: 2, px: { xs: 2, sm: 3, md: 4 } }}>
            <UnifiedChart type="soilHum" cells={selectedCells} {...(!stream && { startDate, endDate })} stream={stream} liveData={liveData} />
          </Box>
          <Box sx={{ py: 2, px: { xs: 2, sm: 3, md: 4 } }}>
            <UnifiedChart type="waterPress" cells={selectedCells} {...(!stream && { startDate, endDate })} stream={stream} liveData={liveData} />
          </Box>
          <Box sx={{ py: 2, px: { xs: 2, sm: 3, md: 4 } }}>
            <UnifiedChart type="waterFlow" cells={selectedCells} {...(!stream && { startDate, endDate })} stream={stream} liveData={liveData} />
          </Box>
        </Stack>

        <Box sx={{ height: { xs: '60px', sm: '80px', md: '100px' } }} />
        */}
      </Box>
    </>
  );
}
export default Dashboard;
