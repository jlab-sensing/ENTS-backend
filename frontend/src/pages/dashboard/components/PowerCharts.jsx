import { React, useState, useEffect, useCallback } from 'react';
import { Grid } from '@mui/material';
import PropTypes from 'prop-types';
import PwrChart from '../../../charts/PwrChart/PwrChart';
import VChart from '../../../charts/VChart/VChart';
import { DateTime } from 'luxon';
import { getPowerData, streamPowerData } from '../../../services/power';
import useInterval from '../../../hooks/useInterval';
function PowerCharts({ cells, startDate, endDate, watch }) {
  const chartSettings = {
    label: [],
    datasets: [],
  };
  const [vChartData, setVChartData] = useState(chartSettings);
  const [pwrChartData, setPwrChartData] = useState(chartSettings);
  const [loadedCells, setLoadedCells] = useState([]);
  // Initialize the combined chart data with empty datasets
  // Access data for each cell and update the combined charts accordingly
  const pColors = ['lightgreen', 'darkgreen'];
  const vColors = ['purple', 'blue'];
  const iColors = ['orange', 'red'];

  async function getPowerChartData() {
    const data = {};
    let loadCells = cells;
    if (!watch) {
      loadCells = cells.filter((c) => !(c.id in loadedCells));
    }
    for (const { id, name } of loadCells) {
      data[id] = {
        name: name,
        powerData: await (watch
          ? streamPowerData(id, startDate, DateTime.now(), true)
          : getPowerData(id, startDate, endDate)),
      };
    }
    return data;
  }

  async function streamPowerChartData() {
    const data = {};
    for (const { id, name } of cells) {
      data[id] = {
        name: name,
        powerData: await streamPowerData(id, DateTime.now().minus({ second: 10 }), DateTime.now(), true),
      };
    }
    return data;
  }

  function updateCharts(watch) {
    const newVChartData = {
      ...vChartData,
      datasets: [],
    };
    const newPwrChartData = {
      ...pwrChartData,
      datasets: [],
    };
    getPowerChartData(watch).then((cellChartData) => {
      let selectCounter = 0;
      let loadCells = cells;
      if (!watch) {
        loadCells = cells.filter((c) => !(c.id in loadedCells));
      }
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
            label: name + ' Voltage (mV)',
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
          label: name + ' Power (µW)',
          data: powerData.p,
          borderColor: pColors[selectCounter],
          borderWidth: 2,
          fill: false,
          radius: 2,
          pointRadius: 1,
        });
        selectCounter += 1;
      }
      console.log(newVChartData, newPwrChartData);
      setVChartData(newVChartData);
      setPwrChartData(newPwrChartData);
      setLoadedCells(loadCells);
    });
  }

  function streamCharts() {
    const newVChartData = {
      ...vChartData,
    };
    const newPwrChartData = {
      ...pwrChartData,
    };
    streamPowerChartData().then((cellChartData) => {
      console.log(cellChartData);
      let selectCounter = 0;
      let foundNewData = false;
      for (const { id } of cells) {
        const cellid = id;
        console.log(Array.isArray(cellChartData[cellid].powerData.i));
        console.log(Array.isArray(cellChartData[cellid].powerData.v));
        console.log(cellChartData[cellid].powerData.i.length);
        console.log(cellChartData[cellid].powerData.v.length);
        console.log(
          Array.isArray(cellChartData[cellid].powerData.i) &&
            cellChartData[cellid].powerData.i.length &&
            Array.isArray(cellChartData[cellid].powerData.v) &&
            cellChartData[cellid].powerData.v.length,
        );
        if (
          Array.isArray(cellChartData[cellid].powerData.i) &&
          cellChartData[cellid].powerData.i.length &&
          Array.isArray(cellChartData[cellid].powerData.v) &&
          cellChartData[cellid].powerData.v.length
        ) {
          foundNewData = true;
          console.log('reaching');
          console.log('data', cellChartData[cellid].powerData);
          console.log('current', newVChartData);
          const name = cellChartData[cellid].name;
          const powerData = cellChartData[cellid].powerData;
          // const terosData = cellChartData[cellid].terosData;
          const pTimestamp = powerData.timestamp.map((dateTime) => DateTime.fromHTTP(dateTime));
          // const tTimestamp = terosData.data.timestamp.map((dateTime) => DateTime.fromHTTP(dateTime));
          newVChartData.labels = newVChartData.labels.concat(pTimestamp);
          newVChartData.datasets[selectCounter].data = newVChartData.datasets[selectCounter].data.concat(powerData.v);
          newVChartData.datasets[selectCounter + 1].data = newVChartData.datasets[selectCounter + 1].data.concat(
            powerData.i,
          );
          //power data
          newPwrChartData.labels = newPwrChartData.labels.concat(pTimestamp);
          newPwrChartData.datasets[selectCounter].data = newPwrChartData.datasets[selectCounter].data.concat(
            powerData.p,
          );
          selectCounter += 1;
        }
      }

      if (foundNewData) {
        console.log(newVChartData, newPwrChartData);
        console.log('updating vchart');
        setVChartData(newVChartData);
        console.log('updating pwrchart');
        setPwrChartData(newPwrChartData);
      }
    });
  }

  useInterval(
    () => {
      streamCharts();
      console.log('updating');
      console.log(vChartData);
      console.log(pwrChartData);
    },
    watch ? 1000 * 10 : null,
  );

  use(() => {
    console.log('test', watch);
    if (Array.isArray(cells) && cells.length) {
      if (watch === true) {
        updateCharts(cells, startDate, endDate);
        // const interval = setInterval(() => {
        //   streamCharts(cells, startDate, endDate);
        //   console.log('updating');
        //   console.log(vChartData);
        //   console.log(pwrChartData);
        // }, 10 * 1000);
        // return () => clearInterval(interval);
      } else {
        updateCharts(cells, startDate, endDate);
      }
    }
    // TODO: need to memoize updating charts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, startDate, endDate, watch]);

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
