import { React, useState, useEffect } from 'react';
import { Grid } from '@mui/material';
import PropTypes from 'prop-types';
import PwrChart from '../../../charts/PwrChart/PwrChart';
import VChart from '../../../charts/VChart/VChart';
import { DateTime } from 'luxon';
import { getPowerData, streamPowerData } from '../../../services/power';
import useInterval from '../../../hooks/useInterval';
function PowerCharts({ cells, startDate, endDate, watch }) {
  //** QUICK WAY to change stream time in seconds */
  const interval = 1000;
  const chartSettings = {
    labels: [],
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
          ? streamPowerData(id, DateTime.now().minus({ second: 10 }), DateTime.now(), true)
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
        powerData: await streamPowerData(id, DateTime.now().minus({ millisecond: interval }), DateTime.now(), true),
      };
    }
    return data;
  }

  function updateCharts() {
    const newVChartData = {
      ...vChartData,
      datasets: [],
    };
    const newPwrChartData = {
      ...pwrChartData,
      datasets: [],
    };
    getPowerChartData().then((cellChartData) => {
      let selectCounter = 0;
      let loadCells = cells;
      if (!watch) {
        loadCells = cells.filter((c) => !(c.id in loadedCells));
      }
      for (const { id } of loadCells) {
        const cellid = id;
        const name = cellChartData[cellid].name;
        const powerData = cellChartData[cellid].powerData;
        console.log(powerData);
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
      console.log(loadCells);
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
      let selectCounter = 0;
      let foundNewData = false;
      for (const { id } of cells) {
        const cellid = id;
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

  function clearCharts() {
    console.log('CLEARNIGN');
    const newVChartData = {
      ...vChartData,
      labels: [],
      datasets: [],
    };
    const newPwrChartData = {
      ...pwrChartData,
      labels: [],
      datasets: [],
    };

    // console.log(newVChartData, newPwrChartData);
    setVChartData(Object.assign({}, newVChartData));
    setPwrChartData(Object.assign({}, newPwrChartData));
  }

  function clearChartDatasets(chartData) {
    for (const dataset of chartData.datasets) {
      dataset.data = [];
    }
    chartData.labels = [];
    console.log('CLEARNIGN data', chartData);
    return chartData;
  }

  useInterval(
    () => {
      streamCharts();
      console.log('updating');
      // console.log(vChartData);
      // console.log(pwrChartData);
    },
    watch ? interval : null,
  );

  useEffect(() => {
    if (Array.isArray(cells) && cells.length && !watch) {
      console.log('Updating charts');
      updateCharts();
    } else if (Array.isArray(cells) && cells.length && watch) {
      // updating react state for object requires new object
      setVChartData(clearChartDatasets(Object.assign({}, vChartData)));
      setPwrChartData(clearChartDatasets(Object.assign({}, pwrChartData)));
    } else {
      // no selected cells
      clearCharts();
    }

    // TODO: need to memoize updating charts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, watch]);

  // useEffect(() => {
  //   if (Array.isArray(cells) && cells.length) {
  //     if (watch) {
  //       console.log('clearn', watch);
  //       setVChartData(clearChartDatasets(vChartData));
  //       setPwrChartData(clearChartDatasets(pwrChartData));
  //     } else {
  //       // updateCharts();
  //     }
  //   }
  // }, [watch]);

  return (
    <>
      <Grid item sx={{ height: '50%' }} xs={4} sm={4} md={5.5} p={0.25}>
        <VChart data={vChartData} />
      </Grid>
      <Grid item sx={{ height: '50%' }} xs={4} sm={4} md={5.5} p={0.25}>
        <PwrChart data={pwrChartData} stream={watch} />
      </Grid>
    </>
  );
}

PowerCharts.propTypes = {
  cells: PropTypes.array,
  startDate: PropTypes.any,
  endDate: PropTypes.any,
  watch: PropTypes.boolean,
};

export default PowerCharts;
