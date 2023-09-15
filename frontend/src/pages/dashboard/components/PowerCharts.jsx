import { React, useState, useEffect } from 'react';
import { Grid } from '@mui/material';
import PropTypes from 'prop-types';
import PwrChart from '../../../charts/PwrChart/PwrChart';
import VChart from '../../../charts/VChart/VChart';
import { DateTime } from 'luxon';
import { getPowerData } from '../../../services/power';

function PowerCharts({ cells, startDate, endDate }) {
  const chartSettings = {
    label: [],
    datasets: [],
  };
  const [vChartData, setVChartData] = useState(chartSettings);
  const [pwrChartData, setPwrChartData] = useState(chartSettings);
  const [loadedCells, setLoadedCells] = useState([]);
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

  async function getCellChartData() {
    const data = {};
    const loadCells = cells.filter((c) => !(c.id in loadedCells));
    for (const { id, name } of loadCells) {
      data[id] = {
        name: name,
        powerData: await getPowerData(id, startDate, endDate),
      };
    }
    return data;
  }
  function updateCharts() {
    getCellChartData().then((cellChartData) => {
      let selectCounter = 0;
      const loadCells = cells.filter((c) => !(c.id in loadedCells));
      for (const { id } of loadCells) {
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
        selectCounter += 1;
      }
      setVChartData(newVChartData);
      setPwrChartData(newPwrChartData);
      setLoadedCells(loadCells);
    });
  }
  useEffect(() => {
    if (Array.isArray(cells) && cells.length) {
      updateCharts(cells, startDate, endDate);
    }
    // TODO: need to memoize updating charts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, startDate, endDate]);

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
