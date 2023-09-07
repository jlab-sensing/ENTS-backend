import { React, useState, useEffect } from 'react';
import { Grid } from '@mui/material';
import PropTypes from 'prop-types';
import PwrChart from '../../../charts/PwrChart/PwrChart';
import VChart from '../../../charts/VChart/VChart';
import { usePowerData } from '../api/getPowerData';
import { getPowerData } from '../../../services/power';

function PowerCharts({ cells, startDate, endDate }) {
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
  const [vChartData, setVChartData] = useState(chartSettings);
  const [pwrChartData, setPwrChartData] = useState(chartSettings);
  const [loadedCells, setLoadedCells] = useState([]);
  useEffect(() => {
    if (Array.isArray(cells) && cells.length) {
      updateCharts(cells, startDate, endDate)
    }
  }, [cells, startDate, endDate]);
  // const powerDataQuery = usePowerData(cells, startDate, endDate);
  // console.log(powerDataQuery);
  // if (powerDataQuery.some((query) => query.isLoading)) {
  //   console.log('loading');
  //   return <span>Loading...</span>;
  // }
  // if (powerDataQuery.some((query) => query.isLoading)) {
  //   for (q of powerDataQuery) {
  //     console.log(q.error.message);
  //   }
  //   // return <span>Error: {powerDataQuery.error.message}</span>;
  // }
  // if (powerDataQuery.every((query) => query.isLoading)) {
  //   for (q of powerDataQuery) {
  //     console.log(q);
  //   }
  // }

  // Initialize the combined chart data with empty datasets
  const newVChartData = {
    ...vChartData,
    datasets: [],
  };
  const newPwrChartData = {
    ...pwrChartData,
    datasets: [],
  };
  // Access data for each cell and update the combined charts accordingly
  const pColors = ['lightgreen', 'darkgreen'];
  const vColors = ['purple', 'blue'];
  const iColors = ['orange', 'red'];
  const tempColors = ['lightgreen', 'darkgreen'];
  const ecColors = ['purple', 'blue'];
  const vwcColors = ['orange', 'red'];

  async function getCellChartData() {
    const data = {};
    const loadCells = cells.map((c) => !(c.id in loadedCells));
    for (const cell of selectedCells) {
      data[cell.id] = {
        name: cell.name,
        powerData: await getPowerData(cell.id, startDate, endDate),
      };
    }
    return data;
  }
  // const loadCells = cells.map((c) => !(c.id in loadedCells));
  // console.log(loadCells);
  // for (let c of loadCells) {
  //   getPowerData(c.id, startDate, endDate).then((response) => {
  //     console.log(response);
  //     setLoadedCells([loadedCells + c.id]);
  //   });
  function updateCharts() {
    getCellChartData().then((cellChartData) => {
      let selectCounter = 0;
      const loadCells = cells.map((c) => !(c.id in loadedCells));
      for (const { id } of loadCells) {
        const cellid = id;
        const name = cellChartData[cellid].name;
        const powerData = cellChartData[cellid].powerData;
        const terosData = cellChartData[cellid].terosData;
        const pTimestamp = powerData.data.timestamp.map((dateTime) => DateTime.fromHTTP(dateTime));
        const tTimestamp = terosData.data.timestamp.map((dateTime) => DateTime.fromHTTP(dateTime));
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
          },
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
          },
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
  }
}

return (
  <>
    <Grid item sx={{ height: '50%' }} xs={4} sm={4} md={5.5} p={0.25}>
      <VChart data={vChartData} />
    </Grid>
    <Grid item sx={{ height: '50%' }} xs={4} sm={4} md={5.5} p={0.25}>
      <PwrChart data={pwrChartData} />
    </Grid>
  </>
);
}

PowerCharts.propTypes = {
  cells: PropTypes.array,
  startDate: PropTypes.any,
  endDate: PropTypes.any,
};

export default PowerCharts;
