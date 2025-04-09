import { React, useState, useEffect } from 'react';
import { Grid } from '@mui/material';
import PropTypes from 'prop-types';
import PwrChart from '../../../charts/PwrChart/PwrChart';
import VChart from '../../../charts/VChart/VChart';
import { DateTime } from 'luxon';
import { getPowerData, streamPowerData } from '../../../services/power';
import useInterval from '../../../hooks/useInterval';
function PowerCharts({ cells, startDate, endDate, stream }) {
  //** QUICK WAY to change stream time in seconds */
  const interval = 1000;
  const chartSettings = {
    labels: [],
    datasets: [],
  };
  // let DateTime = dt.fromObject({
  //   zone: "Asia/Mumbai"
  // })
  const [vChartData, setVChartData] = useState(chartSettings);
  const [pwrChartData, setPwrChartData] = useState(chartSettings);
  const [loadedCells, setLoadedCells] = useState([]);
  // Initialize the combined chart data with empty datasets

  const pColors = ['#377eb8', '#56b4e9', '#009e73', '#e41a1c', '#e69f00', '#f781bf', '#a65628', '#000000'];
  const vColors = ['#377eb8', '#56b4e9', '#009e73', '#e41a1c', '#e69f00', '#f781bf', '#a65628', '#000000'];
  const iColors = ['#4a90d9', '#5ccfe6', '#00c47e', '#ff5e5b', '#f4a742', '#ff85c2', '#c07d50', '#333333'];

  //** gets power data from backend */
  async function getPowerChartData() {
    const data = {};
    let loadCells = cells;
    if (!stream) {
      loadCells = cells.filter((c) => !(c.id in loadedCells));
    }
    for (const { id, name } of loadCells) {
      data[id] = {
        name: name,
        powerData: await (stream
          ? streamPowerData(id, DateTime.now().minus({ second: 20 }).toHTTP(), DateTime.now().toHTTP(), true)
          : getPowerData(id, startDate.toHTTP(), endDate.toHTTP())),
      };
    }
    return data;
  }

  //** streams power data from backend */
  async function streamPowerChartData() {
    const data = {};
    for (const { id, name } of cells) {
      // added fixed stream delay to account of aync api calls
      data[id] = {
        name: name,
        powerData: await streamPowerData(
          id,
          DateTime.now()
            .minus({ millisecond: interval + 29000 })
            .toHTTP(),
          DateTime.now().toHTTP(),
          true,
        ),
      };
    }
    return data;
  }

  /** takes array x and array y  */
  function createDataset(x, y) {
    return x.map((x, i) => {
      return {
        x: x,
        y: y[i],
      };
    });
  }

  //** updates chart based on query */
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
      if (!stream) {
        loadCells = cells.filter((c) => !(c.id in loadedCells));
      }
      for (const { id } of loadCells) {
        const cellid = id;
        const name = cellChartData[cellid].name;
        const powerData = cellChartData[cellid].powerData;
        const pTimestamp = powerData.timestamp.map((dateTime) => DateTime.fromHTTP(dateTime).toMillis());
        newVChartData.labels = pTimestamp;
        const vData = createDataset(pTimestamp, powerData.v);
        const iData = createDataset(pTimestamp, powerData.i);
        const pData = createDataset(pTimestamp, powerData.p);
        newVChartData.datasets.push(
          {
            label: name + ' Voltage (mV)',
            data: vData,
            borderColor: vColors[selectCounter],
            borderWidth: 2,
            fill: false,
            yAxisID: 'vAxis',
            radius: 2,
            pointRadius: 1,
          },
          {
            label: name + ' Current (µA)',
            data: iData,
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
          data: pData,
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

  //** updates chart data points from stream */
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
      if (newVChartData.datasets.length) {
        for (const { id } of cells) {
          const cellid = id;
          if (
            Array.isArray(cellChartData[cellid].powerData.i) &&
            cellChartData[cellid].powerData.i.length &&
            Array.isArray(cellChartData[cellid].powerData.v) &&
            cellChartData[cellid].powerData.v.length
          ) {
            foundNewData = true;
            const powerDataRaw = cellChartData[cellid].powerData;
            const pTimestampRaw = powerDataRaw.timestamp.map((dateTime) => DateTime.fromHTTP(dateTime));
            const dupIdx = pTimestampRaw.reduce((arr, ts, i) => {
              return !newVChartData.labels.some((oldTs) => ts.equals(oldTs)) && arr.push(i), arr;
            }, []);
            const powerData = Object.fromEntries(
              Object.entries(powerDataRaw).map(([key, value]) => [key, value.filter((_, idx) => dupIdx.includes(idx))]),
            );
            const pTimestamp = powerData.timestamp.map((dateTime) => DateTime.fromHTTP(dateTime));
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
      } else {
        for (const { id } of cells) {
          const cellid = id;
          const name = cellChartData[cellid].name;
          const powerData = cellChartData[cellid].powerData;
          const pTimestamp = powerData.timestamp.map((dateTime) => DateTime.fromHTTP(dateTime));
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
      }
      if (foundNewData) {
        setVChartData(newVChartData);
        setPwrChartData(newPwrChartData);
      }
    });
  }

  //** clearing all chart settings */
  function clearCharts() {
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
    setVChartData(Object.assign({}, newVChartData));
    setPwrChartData(Object.assign({}, newPwrChartData));
  }

  //** clearning chart data points and labels */
  function clearChartDatasets(chartData) {
    for (const dataset of chartData.datasets) {
      dataset.data = [];
    }
    chartData.labels = [];
    return chartData;
  }

  useInterval(
    () => {
      streamCharts();
    },
    stream ? interval : null,
  );

  useEffect(() => {
    if (Array.isArray(cells) && cells.length && !stream) {
      updateCharts();
    } else if (Array.isArray(cells) && cells.length && stream) {
      // updating react state for object requires new object
      setVChartData(clearChartDatasets(Object.assign({}, vChartData)));
      setPwrChartData(clearChartDatasets(Object.assign({}, pwrChartData)));
    } else {
      // no selected cells
      clearCharts();
    }

    // TODO: need to memoize updating charts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, stream, startDate, endDate]);

  return (
    <>
      <Grid item sx={{ height: '50%' }} xs={4} sm={4} md={5.5} p={0.25}>
        <VChart data={vChartData} stream={stream} />
      </Grid>
      <Grid item sx={{ height: '50%' }} xs={4} sm={4} md={5.5} p={0.25}>
        <PwrChart data={pwrChartData} stream={stream} />
      </Grid>
    </>
  );
}

PowerCharts.propTypes = {
  cells: PropTypes.array,
  startDate: PropTypes.any,
  endDate: PropTypes.any,
  stream: PropTypes.bool,
};

export default PowerCharts;
