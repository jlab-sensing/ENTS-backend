import { React, useState, useEffect } from 'react';
import { Grid } from '@mui/material';
import PropTypes from 'prop-types';
import PwrChart from '../../../charts/PwrChart/PwrChart';
import VChart from '../../../charts/VChart/VChart';
import { DateTime } from 'luxon';
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
      updateCharts(cells, startDate, endDate);
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
    console.log(cells);
    const loadCells = cells.filter((c) => !(c.id in loadedCells));
    console.log(loadCells);
    for (const { id, name } of loadCells) {
      console.log(id);
      data[id] = {
        name: name,
        powerData: await getPowerData(id, startDate, endDate),
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
      console.log(cellChartData);
      let selectCounter = 0;
      const loadCells = cells.filter((c) => !(c.id in loadedCells));
      for (const { id } of loadCells) {
        console.log(id);
        const cellid = id;
        const name = cellChartData[cellid].name;
        const powerData = cellChartData[cellid].powerData;
        // const terosData = cellChartData[cellid].terosData;
        const pTimestamp = powerData.timestamp.map((dateTime) => DateTime.fromHTTP(dateTime));
        // const tTimestamp = terosData.data.timestamp.map((dateTime) => DateTime.fromHTTP(dateTime));
        newVChartData.labels = pTimestamp;
        newVChartData.datasets.push(
          {
            label: name + ' Voltage (v)',
            data: powerData.v,
            borderColor: vColors[selectCounter],
            borderWidth: 2,
            fill: false,
            yAxisID: 'vAxis',
            radius: 2,
            pointRadius: 1,
          },
          {
            label: name + ' Current (µA)',
            data: powerData.i,
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
          data: powerData.p,
          borderColor: pColors[selectCounter],
          borderWidth: 2,
          fill: false,
          radius: 2,
          pointRadius: 1,
        });
      }
      setVChartData(newVChartData);
      setPwrChartData(newPwrChartData);
    });
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
