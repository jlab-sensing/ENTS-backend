import { Box } from '@mui/material';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import { React, useEffect, useState, useRef } from 'react';
import { getSensorData } from '../../../services/sensor';
import UniversalChart from '../../../charts/UniversalChart';
import {
  extractUnifiedStreamValue,
  matchesSensorStreamType,
  measurementMatches,
  normalizeUnifiedStreamValue,
} from './unifiedChartUtils';
import { CHART_CONFIGS } from './chartConfigs';
import { buildUnifiedChartDataFromCache } from '../catalog/historicalDataLoader';
import ChartPanelPlaceholder from './ChartPanelPlaceholder';

const EMPTY_CELL_SENSORS_BY_ID = {};

function getCellMeasurementData(cellData, measurement) {
  if (!cellData || !measurement) return null;
  if (cellData[measurement]) return cellData[measurement];
  const normalized = measurement.toLowerCase();
  const matchedKey = Object.keys(cellData).find(
    (key) => key !== 'name' && key.toLowerCase() === normalized,
  );
  return matchedKey ? cellData[matchedKey] : null;
}
function UnifiedChart({
  type,
  sensorSpec = null,
  cells,
  startDate,
  endDate,
  stream,
  liveData,
  processedData,
  onDataStatusChange,
  cellSensorsById,
  historicalSensorByKey,
  centralHistoricalActive = false,
  historicalLoading = false,
}) {
  const [resample, setResample] = useState('hour');
  const chartSettings = {
    label: [],
    datasets: [],
  };
  const [sensorChartData, setSensorChartData] = useState(chartSettings);
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimer = useRef(null);
  const fetchGenerationRef = useRef(0);
  const sensorsById = cellSensorsById ?? EMPTY_CELL_SENSORS_BY_ID;

  const config = sensorSpec
    ? {
        sensor_name: sensorSpec.sensor_name,
        measurements: sensorSpec.measurements,
        units: sensorSpec.units ?? [''],
        axisIds: sensorSpec.axisIds ?? ['y'],
        chartId: sensorSpec.chartId ?? `db-sensor-${sensorSpec.sensor_name}`,
        axisPolicy: sensorSpec.axisPolicy,
      }
    : CHART_CONFIGS[type];
  const { sensor_name, measurements, units, axisIds, chartId, axisPolicy } = config || {
    sensor_name: undefined,
    measurements: [],
    units: [],
    axisIds: ['y'],
    chartId: 'missing',
    axisPolicy: undefined,
  };

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
    if (centralHistoricalActive && resample === 'hour') {
      if (historicalLoading || !historicalSensorByKey || Object.keys(historicalSensorByKey).length === 0) {
        return {};
      }
      return buildUnifiedChartDataFromCache(
        cells,
        type,
        sensorsById,
        historicalSensorByKey,
        sensorSpec,
      );
    }

    const cellEntries = await Promise.all(
      cells.map(async ({ id, name }) => {
        const cellSensors = Array.isArray(sensorsById[id]) ? sensorsById[id] : [];
        const relevantSensors = cellSensors.filter(
          (sensor) =>
            sensor?.name === sensor_name && measurementMatches(sensor?.measurement, measurements),
        );

        const seenMeasurements = new Set();
        const uniqueSensors = relevantSensors.filter((sensor) => {
          const key = sensor.measurement.toLowerCase();
          if (seenMeasurements.has(key)) return false;
          seenMeasurements.add(key);
          return true;
        });

        const sensorsToFetch =
          uniqueSensors.length > 0
            ? uniqueSensors
            : measurements.map((meas) => ({ name: sensor_name, measurement: meas }));

        const measEntries = await Promise.all(
          sensorsToFetch.map(async (sensor) => {
            const meas = sensor.measurement;
            const payload = await getSensorData(
              sensor.name,
              id,
              meas,
              startDate.toHTTP(),
              endDate.toHTTP(),
              resample,
            );
            return [meas, payload];
          }),
        );

        return [
          id,
          {
            name,
            ...Object.fromEntries(measEntries),
          },
        ];
      }),
    );

    return Object.fromEntries(cellEntries);
  }

  function createDataset(x, y) {
    return x.map((x, i) => {
      return {
        x: x,
        y: y[i],
      };
    });
  }

  function resolveCellEntry(cellChartData, cellId) {
    return cellChartData[cellId] ?? cellChartData[String(cellId)];
  }

  function updateCharts() {
    if (centralHistoricalActive && resample === 'hour' && historicalLoading) {
      setIsLoading(true);
      return;
    }

    const fetchGeneration = ++fetchGenerationRef.current;
    setIsLoading(true);
    getCellChartData()
      .then((cellChartData) => {
        if (fetchGeneration !== fetchGenerationRef.current) return;
        const newSensorChartData = { labels: [], datasets: [] };
        let selectCounter = 0;
        // Always process all selected cells
        let loadCells = cells;
        for (const { id, name: cellName } of loadCells) {
          const entry = resolveCellEntry(cellChartData, id);
          if (!entry) {
            selectCounter += 1;
            continue;
          }
          const name = entry.name ?? cellName;
          const plottedMeasurements = new Set();
          for (const [idx, meas] of measurements.entries()) {
            const normalizedMeas = meas.toLowerCase();
            if (plottedMeasurements.has(normalizedMeas)) continue;
            const measPayload = getCellMeasurementData(entry, meas);
            const measDataArray = measPayload?.data;
            if (Array.isArray(measDataArray) && measDataArray.length > 0) {
              const timestamp = measPayload.timestamp.map((dateTime) =>
                DateTime.fromHTTP(dateTime).toMillis(),
              );
              const normalizedData =
                sensor_name === 'TEROS12_VWC_ADJ' && meas === 'Volumetric Water Content'
                  ? measDataArray.map((value) => normalizeUnifiedStreamValue(sensor_name, meas, value))
                  : measDataArray;
              const measData = createDataset(timestamp, normalizedData);
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
              plottedMeasurements.add(normalizedMeas);
            }
          }
          selectCounter += 1;
        }
        if (fetchGeneration !== fetchGenerationRef.current) return;
        setSensorChartData(newSensorChartData);
        setIsLoading(false);
      })
      .catch((error) => {
        if (fetchGeneration !== fetchGenerationRef.current) return;
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
    setIsLoading(false);
  }

  useEffect(() => {
    if (stream && liveData && liveData.length > 0) {
      const sensorMeasurements = liveData.filter((measurement) => {
        return (
          matchesSensorStreamType(measurement.type, sensor_name) && cells.some((cell) => cell.id === measurement.cellId)
        );
      });

      if (sensorMeasurements.length > 0) {
        const cellData = {};
        sensorMeasurements.forEach((measurement) => {
          if (!cellData[measurement.cellId]) {
            cellData[measurement.cellId] = [];
          }
          cellData[measurement.cellId].push(measurement);
        });

        const newSensorChartData = {
          labels: [],
          datasets: [],
        };

        let selectCounter = 0;
        let hasAnyData = false;

        for (const { id, name } of cells) {
          const cellMeasurements = cellData[id];
          if (!cellMeasurements || cellMeasurements.length === 0) continue;

          hasAnyData = true;

          const sortedMeasurements = cellMeasurements.sort((a, b) => a.timestamp - b.timestamp);

          const timestamps = sortedMeasurements.map((m) => m.timestamp * 1000);

          measurements.forEach((meas, measIndex) => {
            const dataValues = sortedMeasurements.map((m) => {
              const rawValue = extractUnifiedStreamValue(sensor_name, meas, m.data);
              return normalizeUnifiedStreamValue(sensor_name, meas, rawValue);
            });

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, liveData, cells, processedData, type, sensor_name, measurements, units, axisIds]);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      if (Array.isArray(cells) && cells.length && !stream) {
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
  }, [cells, stream, resample, startDate, endDate, cellSensorsById, historicalSensorByKey, centralHistoricalActive, historicalLoading]);

  const handleResampleChange = (newResample) => {
    setResample(newResample);
  };

  const hasRenderableData = sensorChartData.datasets.some((ds) => Array.isArray(ds.data) && ds.data.length > 0);

  // Notify parent component when data status changes
  useEffect(() => {
    if (onDataStatusChange && !isLoading) {
      onDataStatusChange(hasRenderableData);
    }
  }, [hasRenderableData, isLoading, onDataStatusChange]);

  if (!config) {
    console.error(`Unknown chart type: ${type}`);
    return null;
  }

  if (!config) {
    return <ChartPanelPlaceholder />;
  }

  if (isLoading) {
    return <ChartPanelPlaceholder loading />;
  }

  if (!hasRenderableData) {
    if (cells?.length) {
      return <ChartPanelPlaceholder />;
    }
    return null;
  }

  return (
    <Box sx={{ height: '100%', width: '100%', minWidth: 0, minHeight: 0 }}>
      <UniversalChart
        data={sensorChartData}
        stream={stream}
        chartId={chartId}
        measurements={measurements}
        units={units}
        axisIds={axisIds}
        axisPolicy={axisPolicy}
        {...(!stream && { startDate, endDate })}
        onResampleChange={handleResampleChange}
      />
    </Box>
  );
}

UnifiedChart.propTypes = {
  type: PropTypes.oneOf(Object.keys(CHART_CONFIGS)),
  sensorSpec: PropTypes.shape({
    sensor_name: PropTypes.string.isRequired,
    measurements: PropTypes.arrayOf(PropTypes.string).isRequired,
    units: PropTypes.arrayOf(PropTypes.string),
    axisIds: PropTypes.arrayOf(PropTypes.string),
    chartId: PropTypes.string,
    axisPolicy: PropTypes.string,
  }),
  cells: PropTypes.array,
  startDate: PropTypes.any,
  endDate: PropTypes.any,
  stream: PropTypes.bool,
  liveData: PropTypes.array,
  processedData: PropTypes.object,
  onDataStatusChange: PropTypes.func,
  cellSensorsById: PropTypes.object,
  historicalSensorByKey: PropTypes.object,
  centralHistoricalActive: PropTypes.bool,
  historicalLoading: PropTypes.bool,
};

export default UnifiedChart;
