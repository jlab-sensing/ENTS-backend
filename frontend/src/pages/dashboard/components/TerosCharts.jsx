import { Box, Grid } from '@mui/material';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import { React, useEffect, useRef, useState } from 'react';
import TempChart from '../../../charts/TempChart/TempChart';
import VwcChart from '../../../charts/VwcChart/VwcChart';
import { getTerosData } from '../../../services/teros';
import { toPercentIfFraction } from '../../../charts/VwcChart/vwcValue';
import ChartPanelPlaceholder from './ChartPanelPlaceholder';

function TerosCharts({
  cells,
  startDate,
  endDate,
  stream,
  liveData,
  processedData,
  onDataStatusChange,
  variant = 'both',
  historicalTerosByCell,
  centralHistoricalActive = false,
  historicalLoading = false,
}) {
  const [resample, setResample] = useState('hour');
  const chartSettings = {
    datasets: [],
  };
  const [vwcChartData, setVwcChartData] = useState(chartSettings);
  const [tempChartData, setTempChartData] = useState(chartSettings);
  const [hasData, setHasData] = useState(false);
  const fetchGenerationRef = useRef(0);

  // Access data for each cell and update the combined charts accordingly

  const tempColors = ['#26C6DA', '#FF7043', '#A2708A'];
  const ecColors = ['#26C6DA', '#FF7043', '#A2708A'];
  const vwcColors = ['#26C6DA', '#FF7043', '#A2708A'];

  //** gets teros data from backend */
  async function getTerosChartData(loadCells) {
    const entries = await Promise.all(
      loadCells.map(async ({ id, name }) => {
        const terosData = await getTerosData(id, startDate.toHTTP(), endDate.toHTTP(), resample);
        return [id, { name, terosData }];
      }),
    );
    return Object.fromEntries(entries);
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
  function resolveCellEntry(cellChartData, cellId) {
    return cellChartData[cellId] ?? cellChartData[String(cellId)];
  }

  function applyCellChartData(cellChartData, loadCells) {
    const newVwcChartData = {
      labels: [],
      datasets: [],
    };
    const newTempChartData = {
      labels: [],
      datasets: [],
    };

    let selectCounter = 0;
    let hasAnyData = false;
    for (const { id, name: cellName } of loadCells) {
      const entry = resolveCellEntry(cellChartData, id);
      if (!entry?.terosData) {
        selectCounter += 1;
        continue;
      }

      const name = entry.name ?? cellName;
      const terosData = entry.terosData;

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
    setHasData(hasAnyData);
  }

  function updateCharts() {
    const fetchGeneration = ++fetchGenerationRef.current;
    const loadCells = cells;

    if (centralHistoricalActive && resample === 'hour') {
      if (historicalLoading) return;
      if (fetchGeneration !== fetchGenerationRef.current) return;
      const cellChartData = historicalTerosByCell ?? {};
      const hasCentralData = cells.some(({ id }) => resolveCellEntry(cellChartData, id));
      if (!hasCentralData) return;
      applyCellChartData(cellChartData, loadCells);
      return;
    }

    const finish = (cellChartData) => {
      if (fetchGeneration !== fetchGenerationRef.current) return;
      applyCellChartData(cellChartData, loadCells);
    };

    getTerosChartData(loadCells)
      .then(finish)
      .catch((error) => {
        if (fetchGeneration !== fetchGenerationRef.current) return;
        console.error('Error updating TEROS charts:', error);
        setHasData(false);
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

  // Removed unused clearChartDatasets function

  useEffect(() => {
    if (stream && liveData && liveData.length > 0) {
      const terosMeasurements = liveData.filter(
        (measurement) => measurement.type === 'teros12' && cells.some((cell) => cell.id === measurement.cellId),
      );

      if (terosMeasurements.length > 0) {
        const cellData = {};
        terosMeasurements.forEach((measurement) => {
          if (!cellData[measurement.cellId]) {
            cellData[measurement.cellId] = [];
          }
          cellData[measurement.cellId].push(measurement);
        });

        const newVwcChartData = {
          labels: [],
          datasets: [],
        };
        const newTempChartData = {
          labels: [],
          datasets: [],
        };

        let selectCounter = 0;
        let hasAnyData = false;

        for (const { id, name } of cells) {
          const cellMeasurements = cellData[id];
          if (!cellMeasurements || cellMeasurements.length === 0) continue;

          hasAnyData = true;

          // Sort measurements by timestamp
          const sortedMeasurements = cellMeasurements.sort((a, b) => a.timestamp - b.timestamp);

          // Extract data arrays
          const timestamps = sortedMeasurements.map((m) => m.timestamp * 1000);
          const vwcData = sortedMeasurements.map((m) => toPercentIfFraction(m.data.vwcAdj));
          const ecData = sortedMeasurements.map((m) => m.data.ec);
          const tempData = sortedMeasurements.map((m) => m.data.temp);

          // Create datasets
          const vwcDataset = createDataset(timestamps, vwcData);
          const ecDataset = createDataset(timestamps, ecData);
          const tempDataset = createDataset(timestamps, tempData);

          // Add VWC/EC datasets
          newVwcChartData.labels = timestamps;
          newVwcChartData.datasets.push(
            {
              label: name + ' Volumetric Water Content (%)',
              data: vwcDataset,
              borderColor: vwcColors[selectCounter],
              borderWidth: 2,
              fill: false,
              yAxisID: 'vwcAxis',
              radius: 2,
              pointRadius: 1,
            },
            {
              label: name + ' Electrical Conductivity (µS/cm)',
              data: ecDataset,
              borderColor: ecColors[selectCounter],
              borderWidth: 2,
              fill: false,
              yAxisID: 'ecAxis',
              radius: 2,
              pointRadius: 0,
              borderDash: [5, 5],
            },
          );

          // Add temperature dataset
          newTempChartData.labels = timestamps;
          newTempChartData.datasets.push({
            label: name + ' Temperature (°C)',
            data: tempDataset,
            borderColor: tempColors[selectCounter],
            borderWidth: 2,
            fill: false,
            radius: 2,
            pointRadius: 1,
          });

          selectCounter++;
        }

        if (hasAnyData) {
          setVwcChartData({ ...newVwcChartData });
          setTempChartData({ ...newTempChartData });
          setHasData(true);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, liveData, cells, processedData]);

  // Handle historical data loading (non-streaming mode)
  useEffect(() => {
    if (Array.isArray(cells) && cells.length && !stream) {
      updateCharts();
    } else if (!stream) {
      clearCharts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, stream, resample, startDate, endDate, historicalTerosByCell, centralHistoricalActive, historicalLoading]);

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
    if (centralHistoricalActive && historicalLoading && !stream) {
      return <ChartPanelPlaceholder loading />;
    }
    if (cells?.length) {
      return <ChartPanelPlaceholder />;
    }
    return null;
  }

  const chartHeight = { xs: '400px', md: '450px' };
  const panelChartSx = { height: '100%', width: '100%', minWidth: 0, minHeight: 0 };

  const vwcChart = (
    <VwcChart
      data={vwcChartData}
      stream={stream}
      {...(!stream && { startDate, endDate })}
      onResampleChange={handleResampleChange}
    />
  );

  const tempChart = (
    <TempChart
      data={tempChartData}
      stream={stream}
      {...(!stream && { startDate, endDate })}
      onResampleChange={handleResampleChange}
    />
  );

  if (variant === 'vwc') {
    return (
      <Box sx={panelChartSx}>
        {vwcChart}
      </Box>
    );
  }

  if (variant === 'temp') {
    return (
      <Box sx={panelChartSx}>
        {tempChart}
      </Box>
    );
  }

  return (
    <>
      <Grid item sx={{ height: chartHeight }} xs={12} sm={12} md={stream ? 12 : 6} p={3}>
        {vwcChart}
      </Grid>
      <Grid item sx={{ height: chartHeight }} xs={12} sm={12} md={stream ? 12 : 6} p={3}>
        {tempChart}
      </Grid>
    </>
  );
}

TerosCharts.propTypes = {
  cells: PropTypes.array,
  startDate: PropTypes.any,
  endDate: PropTypes.any,
  stream: PropTypes.bool,
  liveData: PropTypes.array,
  processedData: PropTypes.object,
  onDataStatusChange: PropTypes.func,
  variant: PropTypes.oneOf(['both', 'vwc', 'temp']),
  historicalTerosByCell: PropTypes.object,
  centralHistoricalActive: PropTypes.bool,
  historicalLoading: PropTypes.bool,
};

export default TerosCharts;
