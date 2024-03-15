import { React, useState } from 'react';
import { DateTime } from 'luxon';
import DownloadBtn from './components/DownloadBtn';
import { Box, Grid, Stack, Divider, Button } from '@mui/material';
import DateRangeSel from './components/DateRangeSel';
import CellSelect from './components/CellSelect';
import PowerCharts from './components/PowerCharts';
import TerosCharts from './components/TerosCharts';
import BackBtn from './components/BackBtn';
import SensorChart from './components/SensorChart';

function Dashboard() {
  const [startDate, setStartDate] = useState(DateTime.now().minus({ days: 14 }));
  const [endDate, setEndDate] = useState(DateTime.now());
  const [dBtnDisabled, setDBtnDisabled] = useState(true);
  const [selectedCells, setSelectedCells] = useState([]);
  const [stream, setStream] = useState(false);

  return (
    <>
      <Stack
        direction='column'
        divider={<Divider orientation='horizontal' flexItem />}
        justifyContent='space-evenly'
        sx={{ height: '100vh', boxSizing: 'border-box' }}
      >
        <Stack direction='row' alignItems='center' justifyContent='space-evenly' sx={{ p: 2 }} flex>
          <BackBtn />
          <CellSelect selectedCells={selectedCells} setSelectedCells={setSelectedCells} />
          <Box display='flex' justifyContent='center' alignItems='center'>
            <DateRangeSel
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
            ></DateRangeSel>
          </Box>
          <DownloadBtn
            disabled={dBtnDisabled}
            setDBtnDisabled={setDBtnDisabled}
            cells={selectedCells}
            startDate={startDate}
            endDate={endDate}
          />
          <Button
            variant='outlined'
            onClick={() => {
              console.log('test');
              setStream(!stream);
            }}
          >
            {stream ? 'streaming' : 'hourly'}
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
        justifyContent='space-evenly'
        sx={{ height: '100vh', width:'85vw', mx:'auto', boxSizing: 'border-box' }}
      >
        <SensorChart cells={selectedCells} startDate={startDate} endDate={endDate} />
      </Stack>
    </>
  );
}

export default Dashboard;
