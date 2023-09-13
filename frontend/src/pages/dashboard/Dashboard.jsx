import { React, useState } from 'react';
import { DateTime } from 'luxon';
import DownloadBtn from './components/DownloadBtn';
import { Box, Grid, Stack, Divider } from '@mui/material';
import DateRangeSel from './components/DateRangeSel';
import CellSelect from './components/CellSelect';
import PowerCharts from './components/PowerCharts';
import TerosCharts from './components/TerosCharts';

function Dashboard() {
  const [startDate, setStartDate] = useState(DateTime.now().minus({ days: 14 }));
  const [endDate, setEndDate] = useState(DateTime.now());
  const [dBtnDisabled, setDBtnDisabled] = useState(true);
  // const [cellData, setCellData] = useState([]);
  // const [cellIds, setCellIds] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  // useEffect(() => {
  //   if (Object.keys(cellData).length != 0) {
  //     setDBtnDisabled(false);
  //   }
  // }, [cellData]);

  // useEffect(() => {
  //   getCells().then((response) => {
  //     setCellIds(response.data);
  //   });
  // }, []);

  // useEffect(() => {
  //   if (Array.isArray(cellIds) && cellIds.length) {
  //     console.log(cellIds[0]);
  //     setSelectedCells([cellIds[0]]);
  //   }
  // }, [cellIds]);

  return (
    <Stack
      direction='column'
      divider={<Divider orientation='horizontal' flexItem />}
      justifyContent='spaced-evently'
      sx={{ height: '100vh', boxSizing: 'border-box' }}
    >
      <Stack
        direction='row'
        divider={<Divider orientation='vertical' flexItem />}
        alignItems='center'
        justifyContent='space-evenly'
        sx={{ p: 2 }}
        flex
      >
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
