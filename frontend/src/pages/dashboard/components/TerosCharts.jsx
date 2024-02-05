import { React, useState, useEffect } from 'react';
import { Grid } from '@mui/material';
import PropTypes from 'prop-types';
import { DateTime } from 'luxon';
import VwcChart from '../../../charts/VwcChart/VwcChart';
import TempChart from '../../../charts/TempChart/TempChart';
import { getTerosData } from '../../../services/teros';

function TerosCharts({ cells, startDate, endDate }) {
  const chartSettings = {
    label: [],
    datasets: [],
  };
  const [vwcChartData, setVwcChartData] = useState(chartSettings);
  const [tempChartData, setTempChartData] = useState(chartSettings);
  const [loadedCells, setLoadedCells] = useState([]);
  // Initialize the combined chart data with empty datasets
  const newVwcChartData = {
    ...vwcChartData,
    datasets: [],
  };
  const newTempChartData = {
    ...tempChartData,
    datasets: [],
  };
  // Access data for each cell and update the combined charts accordingly
  const tempColors = ['lightgreen', 'darkgreen'];
  const ecColors = ['purple', 'blue'];
  const vwcColors = ['orange', 'red'];

  async function getCellChartData() {
    const data = {};
    const loadCells = cells.filter((c) => !(c.id in loadedCells));
    for (const { id, name } of loadCells) {
      data[id] = {
        name: name,
        terosData: await getTerosData(id, startDate, endDate),
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
            pointRadius: 0,
            borderDash: [5, 5],
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
        <VwcChart data={vwcChartData} />
      </Grid>
      <Grid item sx={{ height: '50%' }} xs={4} sm={4} md={5.5} p={0.25}>
        <TempChart data={tempChartData} />
      </Grid>
    </>
  );
}

TerosCharts.propTypes = {
  cells: PropTypes.array,
  startDate: PropTypes.any,
  endDate: PropTypes.any,
};

export default TerosCharts;
