import { React, useState, useEffect } from 'react';
import { Grid } from '@mui/material';
import PropTypes from 'prop-types';
import { DateTime } from 'luxon';
import SensorChartTemplate from '../../../charts/SensorChartTemplate';
import { getSensorData } from '../../../services/sensor';

function SensorChart({ cells, startDate, endDate }) {
  // CONFIGURATION
  // List out measurements that your chart is going to display
  const measurements = ['leaf_wetness'];
  const units = ['em'];
  // Colors of data points. Each color represents the next color
  // of the data points as the user selects more cells to compare.
  // Add more measurements depending on how many different values on the charts
  const meas_colors = [
    ['lightgreen', 'darkgreen'],
    ['purple', 'blue'],
    ['orange', 'red'],
  ];
  const axisIds = ['leafAxis'];

  // END CONFIGURATION

  const chartSettings = {
    label: [],
    datasets: [],
  };
  const [sensorChartData, setSensorChartData] = useState(chartSettings);
  const [loadedCells, setLoadedCells] = useState([]);

  // Initialize the combined chart data with empty datasets
  const newSensorChartData = {
    ...sensorChartData,
    datasets: [],
  };

  /** service call to get cell chat data */
  async function getCellChartData() {
    const data = {};
    const loadCells = cells.filter((c) => !(c.id in loadedCells));
    for (const { id, name } of loadCells) {
      data[id] = {
        name: name,
      };
      for (const meas of measurements) {
        data[id] = {
          ...data[id],
          [meas]: await getSensorData(id, meas, startDate, endDate),
        };
      }
    }
    return data;
  }
  /** updates chart data state */
  function updateCharts() {
    getCellChartData().then((sensorChartData) => {
      let selectCounter = 0;
      const loadCells = cells.filter((c) => !(c.id in loadedCells));
      for (const { id } of loadCells) {
        const cellid = id;
        const name = sensorChartData[cellid].name;
        const measurements = Object.keys(sensorChartData[cellid]).filter((k) => k != 'name');
        for (const [idx, meas] of measurements.entries()) {
          const timestamp = sensorChartData[cellid][meas]['timestamp'].map((dateTime) => DateTime.fromHTTP(dateTime));
          newSensorChartData.labels = timestamp;
          newSensorChartData.datasets.push({
            label: name + ` ${meas} (${units[idx]})`,
            data: sensorChartData[cellid][meas]['data'],
            borderColor: meas_colors[idx][selectCounter],
            borderWidth: 2,
            fill: false,
            yAxisID: axisIds[idx],
            radius: 2,
            pointRadius: 1,
          });
        }
        selectCounter += 1;
      }
      setSensorChartData(newSensorChartData);
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
        <SensorChartTemplate data={sensorChartData} />
      </Grid>
    </>
  );
}

SensorChart.propTypes = {
  cells: PropTypes.array,
  startDate: PropTypes.any,
  endDate: PropTypes.any,
};

export default SensorChart;
