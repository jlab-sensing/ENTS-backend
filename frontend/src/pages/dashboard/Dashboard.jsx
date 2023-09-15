import { React, useState } from 'react';
import { DateTime } from 'luxon';
import DownloadBtn from './components/DownloadBtn';
import { Box, Grid, Stack, Divider } from '@mui/material';
import DateRangeSel from './components/DateRangeSel';
import CellSelect from './components/CellSelect';
import PowerCharts from './components/PowerCharts';
import TerosCharts from './components/TerosCharts';
import BackBtn from './components/BackBtn';

function Dashboard() {
  const [startDate, setStartDate] = useState(DateTime.now().minus({ days: 14 }));
  const [endDate, setEndDate] = useState(DateTime.now());
  const [dBtnDisabled, setDBtnDisabled] = useState(true);
  const [selectedCells, setSelectedCells] = useState([]);

  return (
    <Stack
      direction='column'
      divider={<Divider orientation='horizontal' flexItem />}
      justifyContent='spaced-evently'
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
      </Stack>
      <Grid
        container
        spacing={3}
        sx={{ height: '100%', width: '100%', p: 2 }}
        alignItems='center'
        justifyContent='space-evenly'
        columns={{ xs: 4, sm: 8, md: 12 }}
      >
        <PowerCharts cells={selectedCells} startDate={startDate} endDate={endDate} />
        <TerosCharts cells={selectedCells} startDate={startDate} endDate={endDate} />
      </Grid>
    </Stack>
  );
}

export default Dashboard;
