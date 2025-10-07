import { Grid } from '@mui/material';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import { React, useEffect, useState, useRef } from 'react';
import { getSensorData } from '../../../services/sensor';
import UniversalChart from '../../../charts/UniversalChart';

const CHART_CONFIGS = {
  temperature: {
    sensor_name: 'bme280',
    measurements: ['temperature'],
    units: ['°C'],
    axisIds: ['y'],
    chartId: 'temp',
  },
  co2: {
    sensor_name: 'co2',
    measurements: ['co2'],
    units: ['ppm'],
    axisIds: ['y'],
    chartId: 'co2',
  },
  presHum: {
    sensor_name: 'bme280',
    measurements: ['pressure', 'humidity'],
    units: ['kPa', '%'],
    axisIds: ['pressureAxis', 'humidityAxis'],
    chartId: 'presHum',
  },
  sensor: {
    sensor_name: 'phytos31',
    measurements: ['dielectric_permittivity'],
    units: ['1 (unitless)'],
    axisIds: ['y'],
    chartId: 'sensor',
  },
  soilPot: {
    sensor_name: 'teros21',
    measurements: ['soil_water_potential'],
    units: ['kPa'],
    axisIds: ['y'],
    chartId: 'soilPot',
  },
  soilHum: {
    sensor_name: 'sen0308',
    measurements: ['humidity'],
    units: ['%'],
    axisIds: ['y'],
    chartId: 'soilHum',
  },
  waterPress: {
    sensor_name: 'sen0257',
    measurements: ['pressure'],
    units: ['kPa'],
    axisIds: ['y'],
    chartId: 'waterPress',
  },
  waterFlow: {
    sensor_name: 'yfs210c',
    measurements: ['flow'],
    units: ['L/Min'],
    axisIds: ['y'],
    chartId: 'waterFlow',
  },
};

function UnifiedChart({ type, cells, startDate, endDate, stream, liveData, processedData }) {
  const chartSettings = {
    label: [],
    datasets: [],
  };
  const [sensorChartData, setSensorChartData] = useState(chartSettings);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef(null);

  const config = CHART_CONFIGS[type];
  const { sensor_name, measurements, units, axisIds, chartId } = config || {};

  const meas_colors = [
    '#26C6DA',
    '#FF7043',
    '#A2708A',
    '#FF5722',
    '#607D8B',
    '#4CAF50',
    '#FF9800',
    '#9C27B0',
    '#2196F3',
    '#E91E63',
  ];

  async function getCellChartData() {
    const data = {};
    // Always fetch data for all selected cells when cells change
    let loadCells = cells;
    for (const { id, name } of loadCells) {
      data[id] = {
        name: name,
      };
      for (const meas of measurements) {
        data[id] = {
          ...data[id],
          [meas]: await getSensorData(sensor_name, id, meas, startDate.toHTTP(), endDate.toHTTP()),
        };
      }
    }
    return data;
  }

  function createDataset(x, y) {
    return x.map((x, i) => {
      return {
        x: x,
        y: y[i],
      };
    });
  }

  function updateCharts() {
    setIsLoading(true);
    getCellChartData()
      .then((cellChartData) => {
        const newSensorChartData = { labels: [], datasets: [] }; // fresh every time
        let selectCounter = 0;
        // Always process all selected cells
        let loadCells = cells;
        for (const { id } of loadCells) {
          const cellid = id;
          const name = cellChartData[cellid].name;
          const measurements = Object.keys(cellChartData[cellid]).filter((k) => k != 'name');
          for (const [idx, meas] of measurements.entries()) {
            const measDataArray = cellChartData[cellid][meas]['data'];
            if (Array.isArray(measDataArray) && measDataArray.length > 0) {
              const timestamp = cellChartData[cellid][meas]['timestamp'].map((dateTime) =>
                DateTime.fromHTTP(dateTime).toMillis(),
              );
              const measData = createDataset(timestamp, measDataArray);
              newSensorChartData.labels = timestamp;
              newSensorChartData.datasets.push({
                label: name + ` ${meas} (${units[idx]})`,
                data: measData,
                borderColor: meas_colors[(selectCounter * measurements.length + idx) % meas_colors.length],
                borderWidth: 2,
                fill: false,
                yAxisID: axisIds[idx],
                radius: 2,
                pointRadius: 1,
              });
            }
          }
          selectCounter += 1;
        }
        setSensorChartData(newSensorChartData);
        // Update loaded cells to track current selection
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error updating charts:', error);
        setIsLoading(false);
      });
  }

  // Removed unused streamCharts function

  /*
  // Commented out unused streamSensorChartData-dependent code
  function streamCharts() {
    const newSensorChartData = {
      ...sensorChartData,
      datasets: sensorChartData.datasets.map((ds) => ({ ...ds, data: [...ds.data] })),
      labels: [...sensorChartData.labels],
    };

    // streamSensorChartData().then((cellChartData) => {
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
              const datasetIndex = selectCounter * measurements.length + idx;
              if (newSensorChartData.datasets[datasetIndex]) {
                newSensorChartData.datasets[datasetIndex].data =
                  newSensorChartData.datasets[datasetIndex].data.concat(measData);
              }
            }
          }
          selectCounter += 1;
        }
      } else {
        for (const { id } of cells) {
          const cellid = id;
          const name = cellChartData[cellid].name;
          const measurements = Object.keys(cellChartData[cellid]).filter((k) => k != 'name');
          for (const [idx, meas] of measurements.entries()) {
            const timestamp = cellChartData[cellid][meas]['timestamp'].map((dateTime) =>
              DateTime.fromHTTP(dateTime).toMillis(),
            );
            newSensorChartData.labels = timestamp;
            newSensorChartData.datasets.push({
              label: name + ` ${meas} (${units[idx]})`,
              data: cellChartData[cellid][meas]['data'],
              borderColor: meas_colors[(selectCounter * measurements.length + idx) % meas_colors.length],
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

  }
  */

  // Removed unused clearChartDatasets function

  function clearCharts() {
    const newSensorChartData = {
      ...sensorChartData,
      labels: [],
      datasets: [],
    };
    setSensorChartData(Object.assign({}, newSensorChartData));
  }

  useEffect(() => {
    if (stream && liveData && liveData.length > 0) {
      console.log(`Processing ${type} data directly for real-time rendering:`, liveData.length, 'measurements');
      
      const sensorMeasurements = liveData.filter(measurement => {
        const expectedType = sensor_name;
        return measurement.type === expectedType && 
               cells.some(cell => cell.id === measurement.cellId);
      });

      if (sensorMeasurements.length > 0) {
        const cellData = {};
        sensorMeasurements.forEach(measurement => {
          if (!cellData[measurement.cellId]) {
            cellData[measurement.cellId] = [];
          }
          cellData[measurement.cellId].push(measurement);
        });

        const newSensorChartData = {
          labels: [],
          datasets: []
        };

        let selectCounter = 0;
        let hasAnyData = false;

        for (const { id, name } of cells) {
          const cellMeasurements = cellData[id];
          if (!cellMeasurements || cellMeasurements.length === 0) continue;

          hasAnyData = true;
          
          const sortedMeasurements = cellMeasurements.sort((a, b) => a.timestamp - b.timestamp);
          
          const timestamps = sortedMeasurements.map(m => m.timestamp * 1000);
          
          measurements.forEach((meas, measIndex) => {
            let dataValues = [];
            
            // Extract data based on measurement type and sensor
            if (sensor_name === 'bme280') {
              if (meas === 'temperature') {
                dataValues = sortedMeasurements.map(m => m.data.temperature);
              } else if (meas === 'pressure') {
                dataValues = sortedMeasurements.map(m => m.data.pressure);
              } else if (meas === 'humidity') {
                dataValues = sortedMeasurements.map(m => m.data.humidity);
              }
            } else if (sensor_name === 'co2') {
              if (meas === 'co2') {
                dataValues = sortedMeasurements.map(m => m.data.CO2);
              }
            } else if (sensor_name === 'phytos31') {
              if (meas === 'dielectric_permittivity') {
                dataValues = sortedMeasurements.map(m => m.data.voltage);
              }
            } else if (sensor_name === 'teros21') {
              if (meas === 'soil_water_potential') {
                dataValues = sortedMeasurements.map(m => m.data.matricPot);
              }
            } else if (sensor_name === 'sen0308') {
              if (meas === 'humidity') {
                dataValues = sortedMeasurements.map(m => m.data.humidity);
              }
            } else if (sensor_name === 'sen0257') {
              if (meas === 'pressure') {
                dataValues = sortedMeasurements.map(m => m.data.pressure);
              }
            } else if (sensor_name === 'yfs210c') {
              if (meas === 'flow') {
                dataValues = sortedMeasurements.map(m => m.data.flow);
              }
            }

            if (dataValues.length > 0) {
              // Create dataset
              const measDataset = createDataset(timestamps, dataValues);
              
              // Add dataset to chart
              newSensorChartData.labels = timestamps;
              newSensorChartData.datasets.push({
                label: `${name} ${meas} (${units[measIndex]})`,
                data: measDataset,
                borderColor: meas_colors[selectCounter % meas_colors.length],
                borderWidth: 2,
                fill: false,
                yAxisID: axisIds[measIndex] || 'y',
                radius: 2,
                pointRadius: 1,
              });
            }
          });

          selectCounter++;
        }

        if (hasAnyData) {
          setSensorChartData({ ...newSensorChartData });
        }
      }
    } else if (stream && (!liveData || liveData.length === 0)) {
      if (processedData && processedData.byType && processedData.byType[sensor_name]) {
        console.log(`${type} charts frozen - preserving existing data`);
      } else {
        console.log(`${type} charts will be cleared by Dashboard timeout`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, liveData, cells, processedData, type, sensor_name, measurements, units, axisIds]);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      if (Array.isArray(cells) && cells.length && !stream) {
        console.log(`Loading historical ${type} data`);
        updateCharts();
      } else if (!stream) {
        clearCharts();
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, stream]); // Removed startDate, endDate dependencies

  if (!config) {
    console.error(`Unknown chart type: ${type}`);
    return null;
  }

  const hasRenderableData = sensorChartData.datasets.some((ds) => Array.isArray(ds.data) && ds.data.length > 0);

  if (!hasRenderableData && !isLoading) {
    return null;
  }

  return (
    <Grid item sx={{ height: '50%' }} xs={4} sm={4} md={5.5} p={0.25}>
      <UniversalChart
        data={sensorChartData}
        stream={stream}
        chartId={chartId}
        measurements={measurements}
        units={units}
        axisIds={axisIds}
        {...(!stream && { startDate, endDate })}
      />
    </Grid>
  );
}

UnifiedChart.propTypes = {
  type: PropTypes.oneOf(Object.keys(CHART_CONFIGS)).isRequired,
  cells: PropTypes.array,
  startDate: PropTypes.any,
  endDate: PropTypes.any,
  stream: PropTypes.bool,
  liveData: PropTypes.array,
  processedData: PropTypes.object,
};

export default UnifiedChart;
