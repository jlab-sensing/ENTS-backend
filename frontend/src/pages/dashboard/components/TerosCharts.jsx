import { React, useState, useEffect } from 'react';
import { Grid } from '@mui/material';
import PropTypes from 'prop-types';
import { DateTime } from 'luxon';
import VwcChart from '../../../charts/VwcChart/VwcChart';
import TempChart from '../../../charts/TempChart/TempChart';
import { getTerosData, streamTerosData } from '../../../services/teros';
import useInterval from '../../../hooks/useInterval';

function TerosCharts({ cells, startDate, endDate, watch }) {
  //** QUICK WAY to change stream time in seconds */
  const interval = 1000;
  const chartSettings = {
    label: [],
    datasets: [],
  };
  const [vwcChartData, setVwcChartData] = useState(chartSettings);
  const [tempChartData, setTempChartData] = useState(chartSettings);
  const [loadedCells, setLoadedCells] = useState([]);

  // Access data for each cell and update the combined charts accordingly
  const tempColors = ['lightgreen', 'darkgreen'];
  const ecColors = ['purple', 'blue'];
  const vwcColors = ['orange', 'red'];

  async function getTerosChartData() {
    const data = {};
    let loadCells = cells;
    if (!watch) {
      loadCells = cells.filter((c) => !(c.id in loadedCells));
    }
    for (const { id, name } of loadCells) {
      data[id] = {
        name: name,
        terosData: await (watch
          ? streamTerosData(id, DateTime.now().minus({ second: 20 }), DateTime.now(), true)
          : getTerosData(id, startDate, endDate)),
      };
    }
    return data;
  }

  async function streamTerosChartData() {
    const data = {};
    for (const { id, name } of cells) {
      // added fixed stream delay to account of aync api calls
      data[id] = {
        name: name,
        terosData: await streamTerosData(
          id,
          DateTime.now().minus({ millisecond: interval + 1000 }),
          DateTime.now(),
          true,
        ),
      };
    }
    return data;
  }

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
      if (!watch) {
        loadCells = cells.filter((c) => !(c.id in loadedCells));
      }
      for (const { id } of loadCells) {
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
      setVwcChartData(newVwcChartData);
      setTempChartData(newTempChartData);
      setLoadedCells(loadCells);
    });
  }

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
      for (const { id } of cells) {
        const cellid = id;
        if (
          Array.isArray(cellChartData[cellid].terosData.vwc) &&
          cellChartData[cellid].terosData.vwc.length &&
          Array.isArray(cellChartData[cellid].terosData.ec) &&
          cellChartData[cellid].terosData.ec.length
        ) {
          foundNewData = true;

          const terosData = cellChartData[cellid].terosData;
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
      if (foundNewData) {
        setVwcChartData(newVwcChartData);
        setTempChartData(newTempChartData);
      }
    });
  }

  function clearCharts() {
    console.log('CLEARNIGN');
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
    },
    watch ? interval : null,
  );

  useEffect(() => {
    if (Array.isArray(cells) && cells.length && !watch) {
      updateCharts();
    } else if (Array.isArray(cells) && cells.length && watch) {
      // updating react state for object requires new object
      setVwcChartData(clearChartDatasets(Object.assign({}, vwcChartData)));
      setTempChartData(clearChartDatasets(Object.assign({}, tempChartData)));
    } else {
      clearCharts();
    }
  }, [cells, watch]);

  // useCallback(() => {
  //   if (Array.isArray(cells) && cells.length) {
  //     updateCharts();
  //   } else {
  //     clearCharts();
  //   }
  // }, [cells]);

  return (
    <>
      <Grid item sx={{ height: '50%' }} xs={4} sm={4} md={5.5} p={0.25}>
        <VwcChart data={vwcChartData} stream={watch} />
      </Grid>
      <Grid item sx={{ height: '50%' }} xs={4} sm={4} md={5.5} p={0.25}>
        <TempChart data={tempChartData} stream={watch} />
      </Grid>
    </>
  );
}

TerosCharts.propTypes = {
  cells: PropTypes.array,
  startDate: PropTypes.any,
  endDate: PropTypes.any,
  watch: PropTypes.boolean,
};

export default TerosCharts;
