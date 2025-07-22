import { Box, Button, Divider, Grid, Stack, Typography } from '@mui/material';
import { DateTime } from 'luxon';
import { React, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DateRangeNotification from '../../components/DateRangeNotification';
import { useSmartDateRange } from '../../hooks/useSmartDateRange';
import { useCells } from '../../services/cell';
import ArchiveModal from './components/ArchiveModal';
import BackBtn from './components/BackBtn';
import CellSelect from './components/CellSelect';
import CO2Charts from './components/CO2Charts';
import DateRangeSel from './components/DateRangeSel';
import DownloadBtn from './components/DownloadBtn';
import PowerCharts from './components/PowerCharts';
import PresHumChart from './components/PresHumChart';
import SensorChart from './components/SensorChart';
import SoilPotCharts from './components/SoilPotChart';
import TerosCharts from './components/TerosCharts';

function Dashboard() {
  const [startDate, setStartDate] = useState(DateTime.now().minus({ days: 14 }));
  const [endDate, setEndDate] = useState(DateTime.now());
  const [dBtnDisabled, setDBtnDisabled] = useState(true);
  const [selectedCells, setSelectedCells] = useState([]);
  const [stream, setStream] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showNoDataMessage, setShowNoDataMessage] = useState(false);
  const [manualDateSelection, setManualDateSelection] = useState(false);
  const [smartDateRangeApplied, setSmartDateRangeApplied] = useState(false);
  const [powerHasData, setPowerHasData] = useState(false);
  const [terosHasData, setTerosHasData] = useState(false);
  const cells = useCells();
  const [searchParams, setSearchParams] = useSearchParams();

  // Smart date range functionality
  const {
    calculateSmartDateRange,
    showFallbackNotification,
    fallbackDates,
    showFallbackNotificationHandler,
    hideFallbackNotification,
  } = useSmartDateRange();

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
        Math.abs(parsedStartDate.diff(defaultStart, 'hours').hours) > 1 ||
        Math.abs(parsedEndDate.diff(defaultEnd, 'hours').hours) > 1;

      setStartDate(parsedStartDate);
      setEndDate(parsedEndDate);

      // Only block smart date range if this appears to be a genuine manual selection
      if (isManualSelection && searchQueryCells) {
        setManualDateSelection(true);
      }
    }

    setIsInitialized(true);
  }, [searchParams, cells.data]);

  // Apply smart date range when cells are selected (only if not manual selection and not already applied)
  useEffect(() => {
    if (!isInitialized || manualDateSelection || smartDateRangeApplied) return;

    const applySmartDateRange = async () => {
      if (selectedCells.length > 0) {
        try {
          const {
            startDate: smartStartDate,
            endDate: smartEndDate,
            isFallback,
          } = await calculateSmartDateRange(selectedCells);

          setStartDate(smartStartDate);
          setEndDate(smartEndDate);
          setSmartDateRangeApplied(true);

          if (isFallback) {
            showFallbackNotificationHandler();
          }
        } catch (error) {
          console.error('Error applying smart date range:', error);
          // Keep default dates on error
        }
      }
    };

    applySmartDateRange();
  }, [
    selectedCells,
    isInitialized,
    manualDateSelection,
    smartDateRangeApplied,
    calculateSmartDateRange,
    showFallbackNotificationHandler,
  ]);

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

  // Handle manual date changes
  const handleStartDateChange = (newStartDate) => {
    setStartDate(newStartDate);
    setManualDateSelection(true);
    setSmartDateRangeApplied(true); // Prevent smart range from overriding manual selection
  };

  const handleEndDateChange = (newEndDate) => {
    setEndDate(newEndDate);
    setManualDateSelection(true);
    setSmartDateRangeApplied(true); // Prevent smart range from overriding manual selection
  };

  // Handle cell selection changes
  const handleCellSelectionChange = (newSelectedCells) => {
    setSelectedCells(newSelectedCells);
    // Reset smart date range state when cells change to allow re-application
    if (!manualDateSelection) {
      setSmartDateRangeApplied(false);
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
        <DateRangeNotification
          open={showFallbackNotification}
          onClose={hideFallbackNotification}
          fallbackStartDate={fallbackDates.start}
          fallbackEndDate={fallbackDates.end}
        />
        <Stack
          direction='column'
          divider={<Divider orientation='horizontal' flexItem />}
          justifyContent='spaced-evently'
          sx={{ minHeight: '100vh', boxSizing: 'border-box' }}
        >
          <Stack direction='row' alignItems='center' justifyContent={'space-evenly'} sx={{ p: 2 }} spacing={3}>
            <BackBtn />
            <Box sx={{ flexGrow: 1, maxWidth: '30%' }}>
              <CellSelect selectedCells={selectedCells} setSelectedCells={handleCellSelectionChange} />
            </Box>
            <Box display='flex' justifyContent='center' alignItems='center'>
              <DateRangeSel
                startDate={startDate}
                endDate={endDate}
                setStartDate={handleStartDateChange}
                setEndDate={handleEndDateChange}
              ></DateRangeSel>
            </Box>
            {!cells.isLoading && !cells.isError ? <ArchiveModal cells={cells} /> : <span>Loading...</span>}
            <DownloadBtn
              disabled={dBtnDisabled}
              setDBtnDisabled={setDBtnDisabled}
              cells={selectedCells}
              startDate={startDate}
              endDate={endDate}
            />
            <Button variant={stream ? 'contained' : 'outlined'} color='primary' onClick={() => setStream(true)}>
              Streaming
            </Button>
            <Button variant={!stream ? 'contained' : 'outlined'} color='primary' onClick={() => setStream(false)}>
              Hourly
            </Button>
          </Stack>
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
                  startDate={startDate}
                  endDate={endDate}
                  stream={stream}
                  onDataStatusChange={setPowerHasData}
                />
                <TerosCharts
                  cells={selectedCells}
                  startDate={startDate}
                  endDate={endDate}
                  stream={stream}
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
                <SoilPotCharts cells={selectedCells} startDate={startDate} endDate={endDate} stream={stream} />
                <PresHumChart cells={selectedCells} startDate={startDate} endDate={endDate} stream={stream} />
                <SensorChart cells={selectedCells} startDate={startDate} endDate={endDate} stream={stream} />
                <CO2Charts cells={selectedCells} startDate={startDate} endDate={endDate} stream={stream} />
              </Stack>
            </>
          )}
        </Stack>
      </Box>
    </>
  );
}
export default Dashboard;
