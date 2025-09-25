import { Grid } from '@mui/material';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import { React, useEffect, useState } from 'react';
import TempChart from '../../../charts/TempChart/TempChart';
import VwcChart from '../../../charts/VwcChart/VwcChart';
import useInterval from '../../../hooks/useInterval';
import { getTerosData, streamTerosData } from '../../../services/teros';

function TerosCharts({ cells, startDate, endDate, stream, onDataStatusChange }) {
  const [resample, setResample] = useState('hour');
  //** QUICK WAY to change stream time in seconds */
  const interval = 1000;
  const chartSettings = {
    datasets: [],
  };
  const [vwcChartData, setVwcChartData] = useState(chartSettings);
  const [tempChartData, setTempChartData] = useState(chartSettings);
  const [loadedCells, setLoadedCells] = useState([]);
  const [hasData, setHasData] = useState(false);

  // Access data for each cell and update the combined charts accordingly

  const tempColors = ['#26C6DA', '#FF7043', '#A2708A'];
  const ecColors = ['#26C6DA', '#FF7043', '#A2708A'];
  const vwcColors = ['#112E51', '#78909C', '#C1F7DC'];

  //** gets teros data from backend */
  async function getTerosChartData() {
    const data = {};
    // Always fetch data for all selected cells when cells change
    let loadCells = cells;
    for (const { id, name } of loadCells) {
      data[id] = {
        name: name,
        terosData: await (stream
          ? streamTerosData(id, DateTime.now().minus({ second: 20 }).toHTTP(), DateTime.now().toHTTP(), true)
          : getTerosData(id, startDate.toHTTP(), endDate.toHTTP(), resample)),
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
      // Always process all selected cells
      let loadCells = cells;
      let hasAnyData = false;
      for (const { id } of loadCells) {
        const cellid = id;
        const name = cellChartData[cellid].name;
        const terosData = cellChartData[cellid].terosData;

        if (
          (Array.isArray(terosData.temp) && terosData.temp.length > 0) ||
          (Array.isArray(terosData.vwc) && terosData.vwc.length > 0) ||
          (Array.isArray(terosData.ec) && terosData.ec.length > 0)
        ) {
          hasAnyData = true;

          const tTimestamp = terosData.timestamp.map((dateTime) => DateTime.fromHTTP(dateTime).toMillis());
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

          newTempChartData.datasets.push({
            label: name + ' Temperature (°C)',
            data: tempData,
            borderColor: tempColors[selectCounter],
            borderWidth: 2,
            fill: false,
            radius: 2,
            pointRadius: 1,
          });
        }
        selectCounter += 1;
      }
      setVwcChartData(newVwcChartData);
      setTempChartData(newTempChartData);
      // Update loaded cells to track current selection
      setLoadedCells(cells);
      setHasData(hasAnyData);
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
            const tTimestampMillis = tTimestampRaw.map(dt => dt.toMillis());
            const dupIdx = tTimestampMillis.reduce((arr, ts, i) => {
              return !vwcChartData.labels.includes(ts) && arr.push(i), arr;
            }, []);
            const terosData = Object.fromEntries(
              Object.entries(terosDataRaw).map(([key, value]) => [key, value.filter((_, idx) => dupIdx.includes(idx))]),
            );
            const tTimestamp = terosData.timestamp.map((dateTime) => DateTime.fromHTTP(dateTime).toMillis());
            // set vwc chart
            newVwcChartData.labels = newVwcChartData.labels.concat(tTimestamp);
            const vwcData = createDataset(tTimestamp, terosData.vwc);
            const ecData = createDataset(tTimestamp, terosData.ec);
            const tempData = createDataset(tTimestamp, terosData.temp);
            newVwcChartData.datasets[selectCounter].data = newVwcChartData.datasets[selectCounter].data.concat(vwcData);
            newVwcChartData.datasets[selectCounter + 1].data = newVwcChartData.datasets[selectCounter + 1].data.concat(ecData);
            // set temp chart
            newTempChartData.labels = newTempChartData.labels.concat(tTimestamp);
            newTempChartData.datasets[selectCounter].data = newTempChartData.datasets[selectCounter].data.concat(tempData);
            selectCounter += 1;
          }
        }
      } else {
        for (const { id } of cells) {
          const cellid = id;
          const name = cellChartData[cellid].name;
          const terosData = cellChartData[cellid].terosData;
          const tTimestamp = terosData.timestamp.map((dateTime) => DateTime.fromHTTP(dateTime).toMillis());
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
    setHasData(false);
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
    // Reset loadedCells when cells change to force refetch of all data
    setLoadedCells([]);

    if (Array.isArray(cells) && cells.length && !stream) {
      updateCharts();
    } else if (Array.isArray(cells) && cells.length && stream) {
      // updating react state for object requires new object
      setVwcChartData(clearChartDatasets(Object.assign({}, vwcChartData)));
      setTempChartData(clearChartDatasets(Object.assign({}, tempChartData)));
    } else {
      clearCharts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, stream, startDate, endDate, resample]);

  const handleResampleChange = (newResample) => {
    setResample(newResample);
  };

  // Notify parent component when data status changes
  useEffect(() => {
    if (onDataStatusChange) {
      onDataStatusChange(hasData);
    }
  }, [hasData, onDataStatusChange]);

  if (!hasData) {
    return <></>;
  }

  return (
    <>
      <Grid item sx={{ height: { xs: '400px', md: '450px' } }} xs={4} sm={4} md={6} p={3}>
        <VwcChart data={vwcChartData} stream={stream} startDate={startDate} endDate={endDate} onResampleChange={handleResampleChange} />
      </Grid>
      <Grid item sx={{ height: { xs: '400px', md: '450px' } }} xs={4} sm={4} md={6} p={3}>
        <TempChart data={tempChartData} stream={stream} startDate={startDate} endDate={endDate} onResampleChange={handleResampleChange} />
      </Grid>
    </>
  );
}

TerosCharts.propTypes = {
  cells: PropTypes.array,
  startDate: PropTypes.any,
  endDate: PropTypes.any,
  stream: PropTypes.bool,
  onDataStatusChange: PropTypes.func,
};

export default TerosCharts;
