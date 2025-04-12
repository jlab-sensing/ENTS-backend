import { React, useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import DownloadBtn from './components/DownloadBtn';
import { Box, Grid, Stack, Divider, Button } from '@mui/material';
import DateRangeSel from './components/DateRangeSel';
import CellSelect from './components/CellSelect';
import PowerCharts from './components/PowerCharts';
import TerosCharts from './components/TerosCharts';
import BackBtn from './components/BackBtn';
import SensorChart from './components/SensorChart';
import { useCells } from '../../services/cell';
import ArchiveModal from './components/ArchiveModal';
import { useSearchParams } from 'react-router-dom';
import CopyLinkBtn from './components/CopyLinkBtn';
import SoilPotCharts from './components/SoilPotChart';
import PresHumChart from './components/PresHumChart';

function Dashboard() {
  const [startDate, setStartDate] = useState(DateTime.now().minus({ days: 14 }));
  const [endDate, setEndDate] = useState(DateTime.now());
  const [dBtnDisabled, setDBtnDisabled] = useState(true);
  const [selectedCells, setSelectedCells] = useState([]);
  const [stream, setStream] = useState(false);
  const cells = useCells();
  const [searchParams] = useSearchParams();

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
  }, [searchParams, cells.data]);
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
            <CopyLinkBtn startDate={startDate} endDate={endDate} selectedCells={selectedCells} />
            {!cells.isLoading && !cells.isError ? <ArchiveModal cells={cells} /> : <span>Loading...</span>}
            <DownloadBtn
              disabled={dBtnDisabled}
              setDBtnDisabled={setDBtnDisabled}
              cells={selectedCells}
              startDate={startDate}
              endDate={endDate}
            />
          <Button
                variant={stream ? "contained" : "outlined"}
                color="primary"
                onClick={() => setStream(true)}>
                   Streaming
            </Button>
            <Button>
            <Button
               variant={!stream ? "contained" : "outlined"}
               color="primary"
               onClick={() => setStream(false)}>
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
