import { Box, Button, Divider, Grid, Stack } from '@mui/material';
import { DateTime } from 'luxon';
import { React, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCells } from '../../services/cell';
import ArchiveModal from './components/ArchiveModal';
import BackBtn from './components/BackBtn';
import CellSelect from './components/CellSelect';

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
  const cells = useCells();
  const [searchParams, setSearchParams] = useSearchParams();

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

    if (searchQueryStartDate) {
      const parsedStartDate = DateTime.fromISO(searchQueryStartDate);
      setStartDate(parsedStartDate);
    }

    if (searchQueryEndDate) {
      const parsedEndDate = DateTime.fromISO(searchQueryEndDate);
      setEndDate(parsedEndDate);
    }

    setIsInitialized(true);
  }, [searchParams, cells.data]);

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

  return (
    <>
      <Box>
        <Stack
          direction='column'
          divider={<Divider orientation='horizontal' flexItem />}
          justifyContent='spaced-evently'
          sx={{ height: '100vh', boxSizing: 'border-box' }}
        >
          <Stack direction='row' alignItems='center' justifyContent={'space-evenly'} sx={{ p: 2 }} spacing={3}>
            <BackBtn />
            <Box sx={{ flexGrow: 1, maxWidth: '30%' }}>
              <CellSelect selectedCells={selectedCells} setSelectedCells={setSelectedCells} />
            </Box>
            <Box display='flex' justifyContent='center' alignItems='center'>
              <DateRangeSel
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
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
          <Grid
            container
            spacing={3}
            sx={{ height: '100%', width: '100%', p: 2 }}
            alignItems='center'
            justifyContent='space-evenly'
            columns={{ xs: 4, sm: 8, md: 12 }}
          >
            <PowerCharts cells={selectedCells} startDate={startDate} endDate={endDate} stream={stream} />
            <TerosCharts cells={selectedCells} startDate={startDate} endDate={endDate} stream={stream} />
          </Grid>
        </Stack>

        <Stack
          direction='column'
          divider={<Divider orientation='horizontal' flexItem />}
          justifyContent='spaced-evently'
          sx={{ height: '100vh', width: '95%', boxSizing: 'border-box' }}
        >
          <SoilPotCharts cells={selectedCells} startDate={startDate} endDate={endDate} stream={stream} />
          <PresHumChart cells={selectedCells} startDate={startDate} endDate={endDate} stream={stream} />
          <SensorChart cells={selectedCells} startDate={startDate} endDate={endDate} stream={stream} />
        </Stack>
      </Box>
    </>
  );
}
export default Dashboard;
