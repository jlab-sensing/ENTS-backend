import { React, useState, useEffect } from 'react';
import { getCellIds, getCellData } from '../../services/cell';
import { getTerosData } from '../../services/teros';
import { getPowerData } from '../../services/power';
import PwrChart from '../../charts/PwrChart/PwrChart';
import VChart from '../../charts/VChart/VChart';
import VwcChart from '../../charts/VwcChart/VwcChart';
import TempChart from '../../charts/TempChart/TempChart';
import { DateTime } from 'luxon';
import DownloadBtn from './DownloadBtn';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import DateRangeSel from './components/DateRangeSel';

function Dashboard() {
  const chartSettings = {
    label: [],
    datasets: [
      {
        data: [],
        borderColor: 'black',
        borderWidth: 2,
      },
    ],
  };
  const [startDate, setStartDate] = useState(DateTime.now().minus({ days: 14 }));
  const [endDate, setEndDate] = useState(DateTime.now());
  const [dBtnDisabled, setDBtnDisabled] = useState(true);
  const [cellData, setCellData] = useState([]);
  const [selectedCell, setSelectedCell] = useState(-1);
  const [cellIds, setCellIds] = useState([]);
  const [tempChartData, setTempChartData] = useState({
  const [startDate, setStartDate] = useState(
    DateTime.now().minus({ days: 14 })
  );
  const [endDate, setEndDate] = useState(DateTime.now());
  const [dBtnDisabled, setDBtnDisabled] = useState(true);
  const [cellData, setCellData] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [cellIds, setCellIds] = useState([]);
  const [tempChartData, setTempChartData] = useState(chartSettings);
  const [vChartData, setVChartData] = useState({
    label: [],
    datasets: [
      {
        data: [],
        borderColor: 'black',
        borderWidth: 2,
        yAxisID: 'vAxis',
      },
      {
        data: [],
        borderColor: 'black',
        borderWidth: 2,
        yAxisID: 'cAxis',
      },
    ],
  });
  const [pwrChartData, setPwrChartData] = useState({
    label: [],
    datasets: [
      {
        label: 'Voltage',
        data: [],
        borderColor: 'black',
        borderWidth: 2,
      },
    ],
  });
  const [vwcChartData, setVwcChartData] = useState({
    label: [],
    datasets: [
      {
        label: 'VWC',
        data: [],
        borderColor: 'black',
        borderWidth: 2,
        yAxisID: 'vwcAxis',
      },
      {
        label: 'EC',
        data: [],
        borderColor: 'black',
        borderWidth: 2,
        yAxisID: 'ecAxis',
      },
    ],
  });
  async function getCellChartData() {
    const data = {};
    for (const cell of selectedCells) {
      data[cell.id] = {
        name: cell.name,
        powerData: await getPowerData(cell.id, startDate, endDate),
        terosData: await getTerosData(cell.id, startDate, endDate),
      };
    }
    return data;
  }

  const updateCharts = () => {
    // Initialize the combined chart data with empty datasets
    const newVChartData = {
      ...vChartData,
      datasets: [],
    };
    const newTempChartData = {
      ...tempChartData,
      datasets: [],
    };
    const newPwrChartData = {
      ...pwrChartData,
      datasets: [],
    };
    const newVwcChartData = {
      ...vwcChartData,
      datasets: [],
      data: [],
    };
    // Access data for each cell and update the combined charts accordingly
    const pColors = ['lightgreen', 'darkgreen'];
    const vColors = ['purple', 'blue'];
    const iColors = ['orange', 'red'];
    const tempColors = ['lightgreen', 'darkgreen'];
    const ecColors = ['purple', 'blue'];
    const vwcColors = ['orange', 'red'];

    getCellChartData().then((cellChartData) => {
      let selectCounter = 0;
      for (const { id } of selectedCells) {
        const cellid = id;
        const name = cellChartData[cellid].name;
        const powerData = cellChartData[cellid].powerData;
        const terosData = cellChartData[cellid].terosData;
        const pTimestamp = powerData.data.timestamp.map((dateTime) =>
          DateTime.fromHTTP(dateTime)
        );
        const tTimestamp = terosData.data.timestamp.map((dateTime) =>
          DateTime.fromHTTP(dateTime)
        );
        newVChartData.labels = pTimestamp;
        newVChartData.datasets.push(
          {
            label: name + ' Voltage (v)',
            data: powerData.data.v,
            borderColor: vColors[selectCounter],
            borderWidth: 2,
            fill: false,
            yAxisID: 'vAxis',
            radius: 2,
            pointRadius: 1,
          },
          {
            label: name + ' Current (µA)',
            data: powerData.data.i,
            borderColor: iColors[selectCounter],
            borderWidth: 2,
            fill: false,
            yAxisID: 'cAxis',
            radius: 2,
            pointRadius: 1,
          }
        );
        //power data
        newPwrChartData.labels = pTimestamp;
        newPwrChartData.datasets.push({
          label: name + ' Power (µV)',
          data: powerData.data.p,
          borderColor: pColors[selectCounter],
          borderWidth: 2,
          fill: false,
          radius: 2,
          pointRadius: 1,
        });
        // Teros
        newVwcChartData.labels = tTimestamp;
        newVwcChartData.datasets.push(
          {
            label: name + ' Volumetric Water Content (VWC)',
            data: terosData.data.vwc,
            borderColor: vwcColors[selectCounter],
            borderWidth: 2,
            fill: false,
            yAxisID: 'vwcAxis',
            radius: 2,
            pointRadius: 1,
          },
          {
            label: name + ' Electrical Conductivity (µS/cm)',
            data: terosData.data.ec,
            borderColor: ecColors[selectCounter],
            borderWidth: 2,
            fill: false,
            yAxisID: 'ecAxis',
            radius: 2,
            pointRadius: 1,
          }
        );

        // Update the combined Temperature Chart data for the specific cell
        newTempChartData.labels = tTimestamp;
        newTempChartData.datasets.push({
          label: name + ' Temperature',
          data: terosData.data.temp,
          borderColor: tempColors[selectCounter],
          borderWidth: 2,
          fill: false,
          radius: 2,
          pointRadius: 1,
        });
        selectCounter += 1;
      }
      setVChartData(newVChartData);
      setTempChartData(newTempChartData);
      setPwrChartData(newPwrChartData);
      setVwcChartData(newVwcChartData);
    });
  };

  useEffect(() => {
    if (Array.isArray(selectedCells) && selectedCells.length) {
      updateCharts(startDate, endDate);
    }
  }, [selectedCells, startDate, endDate]);

  useEffect(() => {
    if (Object.keys(cellData).length != 0) {
      setDBtnDisabled(false);
    }
  }, [cellData]);

  useEffect(() => {
    getCellIds().then((response) => {
      setCellIds(response.data);
    });
  }, []);

  useEffect(() => {
    if (Array.isArray(cellIds) && cellIds.length) {
      console.log(cellIds[0]);
      setSelectedCells([cellIds[0]]);
    }
  }, [cellIds]);

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
        <FormControl sx={{ width: 1 / 4 }}>
          <InputLabel id='cell-select'>Cell</InputLabel>
          {selectedCells && (
            <Select
              labelId='cell-select-label'
              id='cell-select'
              value={selectedCells}
              multiple
              label='Cell'
              defaultValue={selectedCells}
              onChange={(e) => {
                setSelectedCells(e.target.value);
              }}
            >
              {Array.isArray(cellIds)
                ? cellIds.map((cell) => {
                    return (
                      <MenuItem value={cell} key={cell.id}>
                        {cell.name}
                      </MenuItem>
                    );
                  })
                : ''}
            </Select>
          )}
        </FormControl>
        <Box display='flex' justifyContent='center' alignItems='center'>
          <DateRangeSel
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
          ></DateRangeSel>
        </Box>
        <DownloadBtn disabled={dBtnDisabled} data={cellData} />
      </Stack>
      <Grid
        container
        spacing={3}
        sx={{ height: '100%', width: '100%', p: 2 }}
        alignItems='center'
        justifyContent='space-evenly'
        columns={{ xs: 4, sm: 8, md: 12 }}
      >
        <Grid item sx={{ height: '50%' }} xs={4} sm={4} md={5.5} p={0.25}>
          <VChart data={vChartData} />
        </Grid>
        <Grid item sx={{ height: '50%' }} xs={4} sm={4} md={5.5} p={0.25}>
          <PwrChart data={pwrChartData} />
        </Grid>
        <Grid item sx={{ height: '50%' }} xs={4} sm={4} md={5.5} p={0.25}>
          <VwcChart data={vwcChartData} />
        </Grid>
        <Grid item sx={{ height: '50%' }} xs={4} sm={4} md={5.5} p={0.25}>
          <TempChart data={tempChartData} />
        </Grid>
      </Grid>
    </Stack>
  );
}

export default Dashboard;
