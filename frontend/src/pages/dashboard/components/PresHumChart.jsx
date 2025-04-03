import { React, useState, useEffect } from 'react';
import { Grid } from '@mui/material';
import PropTypes from 'prop-types';
import { DateTime } from 'luxon';
import PresHumChart from '../../../charts/PresHumChart/PresHumChart';
import { getSensorData, streamSensorData } from '../../../services/sensor';
import useInterval from '../../../hooks/useInterval';

function PresHumCharts({ cells, startDate, endDate, stream }) {
  // CONFIGURATION
  // List out measurements that your chart is going to display
  const sensor_name = 'bme280';
  const measurements = ['pressure', 'humidity'];
  const units = ['hPa', '%'];
  // Colors of data points. Each color represents the next color
  // of the data points as the user selects more cells to compare.
  // Add more measurements depending on how many different values on the charts
  const meas_colors = [
    ['lightgreen', 'darkgreen'],
    ['purple', 'blue'],
    ['orange', 'red'],
  ];
  const axisIds = ['pressureAxis', 'humidityAxis'];

  //** QUICK WAY to change stream time in seconds */
  const interval = 1000;

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
    let loadCells = cells;
    if (!stream) {
      loadCells = cells.filter((c) => !(c.id in loadedCells));
    }
    for (const { id, name } of loadCells) {
      data[id] = {
        name: name,
      };
      for (const meas of measurements) {
        data[id] = {
          ...data[id],
          [meas]: await (stream
            ? streamSensorData(
                sensor_name,
                id,
                meas,
                DateTime.now().minus({ second: 20 }).toHTTP(),
                DateTime.now().toHTTP(),
                true,
              )
            : getSensorData(sensor_name, id, meas, startDate.toHTTP(), endDate.toHTTP())),
        };
      }
    }
    return data;
  }

  //** streams sensor data from backend */
  async function streamSensorChartData() {
    const data = {};
    for (const { id, name } of cells) {
      data[id] = {
        name: name,
      };
      for (const meas of measurements) {
        data[id] = {
          ...data[id],
          [meas]: await streamSensorData(
            sensor_name,
            id,
            meas,
            DateTime.now()
              .minus({ millisecond: interval + 29000 })
              .toHTTP(),
            DateTime.now().toHTTP(),
            true,
          ),
        };
      }
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

  /** updates chart data state */
  function updateCharts() {
    getCellChartData().then((cellChartData) => {
      let selectCounter = 0;
      let loadCells = cells;
      if (!stream) {
        loadCells = cells.filter((c) => !(c.id in loadedCells));
      }
      for (const { id } of loadCells) {
        const cellid = id;
        const name = cellChartData[cellid].name;
        const measurements = Object.keys(cellChartData[cellid]).filter((k) => k != 'name');
        for (const [idx, meas] of measurements.entries()) {
          const timestamp = cellChartData[cellid][meas]['timestamp'].map((dateTime) => DateTime.fromHTTP(dateTime));
          const measData = createDataset(timestamp, cellChartData[cellid][meas]['data']);
          newSensorChartData.labels = timestamp;
          newSensorChartData.datasets.push({
            label: name + ` ${meas} (${units[idx]})`,
            data: measData,
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

  //** updates chart data points from stream */
  function streamCharts() {
    const newSensorChartData = {
      ...sensorChartData,
    };
    streamSensorChartData().then((cellChartData) => {
      let selectCounter = 0;
      let foundNewData = false;
      if (newSensorChartData.datasets.length) {
        for (const { id } of cells) {
          const cellid = id;
          const measurements = Object.keys(cellChartData[cellid]).filter((k) => k != 'name');
          for (const [idx, meas] of measurements.entries()) {
            if (Array.isArray(cellChartData[cellid][meas]['data']) && cellChartData[cellid][meas]['data'].length) {
              foundNewData = true;
              const sTimestampRaw = cellChartData[cellid][meas]['timestamp'].map((dateTime) =>
                DateTime.fromHTTP(dateTime),
              );
              const sensorDataRaw = cellChartData[cellid][meas]['data'];
              const dupIdx = sTimestampRaw.reduce((arr, ts, i) => {
                return !newSensorChartData.labels.some((oldTs) => ts.equals(oldTs)) && arr.push(i), arr;
              }, []);
              const sensorData = sensorDataRaw.filter((_, i) => dupIdx.includes(i));
              const sTimestamp = sTimestampRaw.filter((_, i) => dupIdx.includes(i));
              const measData = createDataset(sTimestamp, sensorData);
              newSensorChartData.labels = newSensorChartData.labels.concat(sTimestamp);
              const step = selectCounter === 0 ? 0 : 1;
              newSensorChartData.datasets[selectCounter + idx + step].data =
                newSensorChartData.datasets[selectCounter + idx + step].data.concat(measData);
            }
          }
          selectCounter += 1;
        }
      } else {
        for (const { id } of cells) {
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
      }
      if (foundNewData) {
        setSensorChartData(newSensorChartData);
      }
    });
  }

  //** clearing all chart settings */
  function clearCharts() {
    const newSensorChartData = {
      ...sensorChartData,
      labels: [],
      datasets: [],
    };
    setSensorChartData(Object.assign({}, newSensorChartData));
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
      setSensorChartData(clearChartDatasets(Object.assign({}, sensorChartData)));
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
        <PresHumChart data={sensorChartData} />
      </Grid>
    </>
  );
}

PresHumCharts.propTypes = {
  cells: PropTypes.array,
  startDate: PropTypes.any,
  endDate: PropTypes.any,
  stream: PropTypes.bool,
};

export default PresHumCharts;
