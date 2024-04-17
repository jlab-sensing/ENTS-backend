import { React, useState, useEffect } from 'react';
import { Grid } from '@mui/material';
import PropTypes from 'prop-types';
import { DateTime } from 'luxon';
import VwcChart from '../../../charts/VwcChart/VwcChart';
import TempChart from '../../../charts/TempChart/TempChart';
import { getTerosData, streamTerosData } from '../../../services/teros';
import useInterval from '../../../hooks/useInterval';

function TerosCharts({ cells, startDate, endDate, stream }) {
  //** QUICK WAY to change stream time in seconds */
  const interval = 1000;
  const chartSettings = {
    datasets: [],
  };
  const [vwcChartData, setVwcChartData] = useState(chartSettings);
  const [tempChartData, setTempChartData] = useState(chartSettings);
  const [loadedCells, setLoadedCells] = useState([]);

  // Access data for each cell and update the combined charts accordingly
  const tempColors = ['lightgreen', 'darkgreen'];
  const ecColors = ['purple', 'blue'];
  const vwcColors = ['orange', 'red'];

  //** gets teros data from backend */
  async function getTerosChartData() {
    const data = {};
    let loadCells = cells;
    if (!stream) {
      loadCells = cells.filter((c) => !(c.id in loadedCells));
    }
    for (const { id, name } of loadCells) {
      data[id] = {
        name: name,
        terosData: await (stream
          ? streamTerosData(id, DateTime.now().minus({ second: 20 }).toHTTP(), DateTime.now().toHTTP(), true)
          : getTerosData(id, startDate.toHTTP(), endDate.toHTTP())),
      };
    }
    return data;
  }

  //** streams teros data from backend */
  async function streamTerosChartData() {
    const data = {};
    for (const { id, name } of cells) {
      // added fixed stream delay to account of aync api calls
      data[id] = {
        name: name,
        terosData: await streamTerosData(
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
    const newVwcChartData = {
      ...vwcChartData,
      datasets: [],
    };
    const newTempChartData = {
      ...tempChartData,
      datasets: [],
    };
    getTerosChartData().then((cellChartData) => {
      let selectCounter = 0;
      let loadCells = cells;
      if (!stream) {
        loadCells = cells.filter((c) => !(c.id in loadedCells));
      }
      for (const { id } of loadCells) {
        const cellid = id;
        const name = cellChartData[cellid].name;
        const terosData = cellChartData[cellid].terosData;
        const tTimestamp = terosData.timestamp.map((dateTime) => DateTime.fromHTTP(dateTime).toMillis());
        // newVwcChartData.labels = tTimestamp;

        /** creating dataset so chartjs doesn't have to parse data itself for decimation*/
        const tempData = createDataset(tTimestamp, terosData.temp);
        const vwcData = createDataset(tTimestamp, terosData.vwc);
        const ecData = createDataset(tTimestamp, terosData.ec);
        newVwcChartData.datasets.push(
          {
            label: name + ' Volumetric Water Content (%)',
            data: vwcData,
            borderColor: vwcColors[selectCounter],
            borderWidth: 2,
            fill: false,
            yAxisID: 'vwcAxis',
            radius: 2,
            pointRadius: 1,
          },
          {
            label: name + ' Electrical Conductivity (µS/cm)',
            data: ecData,
            borderColor: ecColors[selectCounter],
            borderWidth: 2,
            fill: false,
            yAxisID: 'ecAxis',
            radius: 2,
            pointRadius: 0,
            borderDash: [5, 5],
          },
        );

        // Update the combined Temperature Chart data for the specific cell
        // newTempChartData.labels = tTimestamp;
        newTempChartData.datasets.push({
          label: name + ' Temperature (°C)',
          data: tempData,
          borderColor: tempColors[selectCounter],
          borderWidth: 2,
          fill: false,
          radius: 2,
          pointRadius: 1,
        });
        selectCounter += 1;
      }
      setVwcChartData(newVwcChartData);
      setTempChartData(newTempChartData);
      setLoadedCells(loadCells);
    });
  }

  //** updates chart data points from stream */
  function streamCharts() {
    const newVwcChartData = {
      ...vwcChartData,
    };
    const newTempChartData = {
      ...tempChartData,
    };
    streamTerosChartData().then((cellChartData) => {
      let selectCounter = 0;
      let foundNewData = false;
      if (newVwcChartData.datasets.length) {
        for (const { id } of cells) {
          const cellid = id;
          if (
            Array.isArray(cellChartData[cellid].terosData.vwc) &&
            cellChartData[cellid].terosData.vwc.length &&
            Array.isArray(cellChartData[cellid].terosData.ec) &&
            cellChartData[cellid].terosData.ec.length
          ) {
            foundNewData = true;
            const terosDataRaw = cellChartData[cellid].terosData;
            const tTimestampRaw = terosDataRaw.timestamp.map((dateTime) => DateTime.fromHTTP(dateTime));
            const dupIdx = tTimestampRaw.reduce((arr, ts, i) => {
              return !vwcChartData.labels.some((oldTs) => ts.equals(oldTs)) && arr.push(i), arr;
            }, []);
            const terosData = Object.fromEntries(
              Object.entries(terosDataRaw).map(([key, value]) => [key, value.filter((_, idx) => dupIdx.includes(idx))]),
            );
            const tTimestamp = terosData.timestamp.map((dateTime) => DateTime.fromHTTP(dateTime));
            // set vwc chart
            newVwcChartData.labels = newVwcChartData.labels.concat(tTimestamp);
            newVwcChartData.datasets[selectCounter].data = newVwcChartData.datasets[selectCounter].data.concat(
              terosData.vwc,
            );
            newVwcChartData.datasets[selectCounter + 1].data = newVwcChartData.datasets[selectCounter + 1].data.concat(
              terosData.ec,
            );
            // set temp chart
            newTempChartData.labels = newTempChartData.labels.concat(tTimestamp);
            newTempChartData.datasets[selectCounter].data = newTempChartData.datasets[selectCounter].data.concat(
              terosData.temp,
            );
            selectCounter += 1;
          }
        }
      } else {
        for (const { id } of cells) {
          const cellid = id;
          const name = cellChartData[cellid].name;
          const terosData = cellChartData[cellid].terosData;
          const tTimestamp = terosData.timestamp.map((dateTime) => DateTime.fromHTTP(dateTime));
          newVwcChartData.labels = tTimestamp;
          newVwcChartData.datasets.push(
            {
              label: name + ' Volumetric Water Content (%)',
              data: terosData.vwc,
              borderColor: vwcColors[selectCounter],
              borderWidth: 2,
              fill: false,
              yAxisID: 'vwcAxis',
              radius: 2,
              pointRadius: 1,
            },
            {
              label: name + ' Electrical Conductivity (µS/cm)',
              data: terosData.ec,
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
            label: name + ' Temperature (°C)',
            data: terosData.temp,
            borderColor: tempColors[selectCounter],
            borderWidth: 2,
            fill: false,
            radius: 2,
            pointRadius: 1,
          });
          selectCounter += 1;
        }
      }
      if (foundNewData) {
        setVwcChartData(newVwcChartData);
        setTempChartData(newTempChartData);
      }
    });
  }

  //** clearing all chart settings */
  function clearCharts() {
    const newVwcChartData = {
      ...vwcChartData,
      labels: [],
      datasets: [],
    };
    const newTempChartData = {
      ...tempChartData,
      labels: [],
      datasets: [],
    };
    setVwcChartData(Object.assign({}, newVwcChartData));
    setTempChartData(Object.assign({}, newTempChartData));
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
      setVwcChartData(clearChartDatasets(Object.assign({}, vwcChartData)));
      setTempChartData(clearChartDatasets(Object.assign({}, tempChartData)));
    } else {
      //no selected cells
      clearCharts();
    }
    // TODO: need to memoize updating charts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, stream, startDate, endDate]);

  return (
    <>
      <Grid item sx={{ height: '50%' }} xs={4} sm={4} md={5.5} p={0.25}>
        <VwcChart data={vwcChartData} stream={stream} />
      </Grid>
      <Grid item sx={{ height: '50%' }} xs={4} sm={4} md={5.5} p={0.25}>
        <TempChart data={tempChartData} stream={stream} />
      </Grid>
    </>
  );
}

TerosCharts.propTypes = {
  cells: PropTypes.array,
  startDate: PropTypes.any,
  endDate: PropTypes.any,
  stream: PropTypes.bool,
};

export default TerosCharts;
