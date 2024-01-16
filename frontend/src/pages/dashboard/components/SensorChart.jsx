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

  async function getCellChartData() {
    const data = {};
    const loadCells = cells.filter((c) => !(c.id in loadedCells));
    for (const { id, name } of loadCells) {
      data[id] = {
        name: name,
      };
      console.log('cellid', id);
      for (const meas of measurements) {
        data[id] = {
          ...data[id],
          [meas]: await getSensorData(id, meas, startDate, endDate),
        };
      }
    }
    return data;
  }
  /**
   * Data = {
   * name: cell_1
   * leaf_wetness:{
   *  ts
   *  data
   * }:
   * measurement2:{
   *  ts
   *  data
   * }:
   */

  function updateCharts() {
    getCellChartData().then((sensorChartData) => {
      let selectCounter = 0;
      const loadCells = cells.filter((c) => !(c.id in loadedCells));
      for (const { id } of loadCells) {
        const cellid = id;
        const name = sensorChartData[cellid].name;
        const measurements = Object.keys(sensorChartData[cellid]).filter((k) => k != 'name');
        console.log('obj', sensorChartData);
        console.log(measurements);
        for (const [idx, meas] of measurements.entries()) {
          console.log('idx, mea', idx, meas);
          // console.log('mea data0', sensorChartData['leaf_wetness']);
          console.log('mea data1', sensorChartData[meas]);
          console.log('mea data2', sensorChartData[cellid][meas]['data']);
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

        // // Update the combined Temperature Chart data for the specific cell
        // newTempChartData.labels = tTimestamp;
        // newTempChartData.datasets.push({
        //   label: name + ' Temperature',
        //   data: terosData.temp,
        //   borderColor: tempColors[selectCounter],
        //   borderWidth: 2,
        //   fill: false,
        //   radius: 2,
        //   pointRadius: 1,
        // });
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
      {/* <Grid item sx={{ height: '50%' }} xs={4} sm={4} md={5.5} p={0.25}>
        <VwcChart data={vwcChartData} />
      </Grid>
      <Grid item sx={{ height: '50%' }} xs={4} sm={4} md={5.5} p={0.25}>
        <TempChart data={tempChartData} />
      </Grid> */}
    </>
  );
}

SensorChart.propTypes = {
  cells: PropTypes.array,
  startDate: PropTypes.any,
  endDate: PropTypes.any,
};

export default SensorChart;
