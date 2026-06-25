import { Box, Grid } from '@mui/material';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import { React, useEffect, useRef, useState } from 'react';
import PwrChart from '../../../charts/PwrChart/PwrChart';
import VChart from '../../../charts/VChart/VChart';
import { getPowerData } from '../../../services/power';
import ChartPanelPlaceholder from './ChartPanelPlaceholder';
function PowerCharts({
  cells,
  startDate,
  endDate,
  stream,
  liveData,
  processedData,
  onDataStatusChange,
  variant = 'both',
  historicalPowerByCell,
  centralHistoricalActive = false,
  historicalLoading = false,
}) {
  const [resample, setResample] = useState('hour');
  const chartSettings = {
    labels: [],
    datasets: [],
  };
  // let DateTime = dt.fromObject({
  //   zone: "Asia/Mumbai"
  // })
  const [vChartData, setVChartData] = useState(chartSettings);
  const [pwrChartData, setPwrChartData] = useState(chartSettings);
  const [hasData, setHasData] = useState(false);
  const fetchGenerationRef = useRef(0);
  
  // Initialize the combined chart data with empty datasets

  const pColors = ['#26C6DA', '#FF7043', '#A2708A'];
  const vColors = ['#26C6DA', '#FF7043', '#A2708A'];
  const iColors = ['#112E51', '#78909C', '#C1F7DC'];

  //** gets power data from backend */
  async function getPowerChartData(loadCells) {
    const entries = await Promise.all(
      loadCells.map(async ({ id, name }) => {
        const powerData = await getPowerData(id, startDate.toHTTP(), endDate.toHTTP(), resample);
        return [id, { name, powerData }];
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
    const newVChartData = {
      labels: [],
      datasets: [],
    };
    const newPwrChartData = {
      labels: [],
      datasets: [],
    };

    let selectCounter = 0;
    let hasAnyData = false;
    for (const { id, name: cellName } of loadCells) {
      const entry = resolveCellEntry(cellChartData, id);
      if (!entry?.powerData) {
        selectCounter += 1;
        continue;
      }

      const name = entry.name ?? cellName;
      const powerData = entry.powerData;

      if (
        (Array.isArray(powerData.v) && powerData.v.length > 0) ||
        (Array.isArray(powerData.i) && powerData.i.length > 0) ||
        (Array.isArray(powerData.p) && powerData.p.length > 0)
      ) {
        hasAnyData = true;

        const pTimestamp = powerData.timestamp.map((dateTime) => DateTime.fromHTTP(dateTime).toMillis());
        newVChartData.labels = pTimestamp;
        const vData = createDataset(pTimestamp, powerData.v);
        const iData = createDataset(pTimestamp, powerData.i);
        const pData = createDataset(pTimestamp, powerData.p);
        newVChartData.datasets.push(
          {
            label: name + ' Voltage (mV)',
            data: vData,
            borderColor: vColors[selectCounter],
            borderWidth: 2,
            fill: false,
            yAxisID: 'vAxis',
            radius: 2,
            pointRadius: 1,
          },
          {
            label: name + ' Current (µA)',
            data: iData,
            borderColor: iColors[selectCounter],
            borderWidth: 2,
            fill: false,
            yAxisID: 'cAxis',
            radius: 2,
            pointRadius: 1,
          },
        );
        newPwrChartData.labels = pTimestamp;
        newPwrChartData.datasets.push({
          label: name + ' Power (µW)',
          data: pData,
          borderColor: pColors[selectCounter],
          borderWidth: 2,
          fill: false,
          radius: 2,
          pointRadius: 1,
        });
      }
      selectCounter += 1;
    }

    setVChartData(newVChartData);
    setPwrChartData(newPwrChartData);
    setHasData(hasAnyData);
  }

  function updateCharts() {
    const fetchGeneration = ++fetchGenerationRef.current;
    const loadCells = cells;

    if (centralHistoricalActive && resample === 'hour') {
      if (historicalLoading) return;
      if (fetchGeneration !== fetchGenerationRef.current) return;
      const cellChartData = historicalPowerByCell ?? {};
      const hasCentralData = cells.some(({ id }) => resolveCellEntry(cellChartData, id));
      if (!hasCentralData) return;
      applyCellChartData(cellChartData, loadCells);
      return;
    }

    const finish = (cellChartData) => {
      if (fetchGeneration !== fetchGenerationRef.current) return;
      applyCellChartData(cellChartData, loadCells);
    };

    getPowerChartData(loadCells)
      .then(finish)
      .catch((error) => {
        if (fetchGeneration !== fetchGenerationRef.current) return;
        console.error('Error updating power charts:', error);
        setHasData(false);
      });
  }


  //** clearing all chart settings */
  function clearCharts() {
    const newVChartData = {
      ...vChartData,
      labels: [],
      datasets: [],
    };
    const newPwrChartData = {
      ...pwrChartData,
      labels: [],
      datasets: [],
    };
    setVChartData(Object.assign({}, newVChartData));
    setPwrChartData(Object.assign({}, newPwrChartData));
    setHasData(false);
  }

  // Removed unused clearChartDatasets function

  // Process live WebSocket data when it changes - DIRECT PROCESSING FOR REAL-TIME
  useEffect(() => {
    if (stream && liveData && liveData.length > 0) {
      const powerMeasurements = liveData.filter(measurement => 
        measurement.type === 'power' && 
        cells.some(cell => cell.id === measurement.cellId)
      );

      if (powerMeasurements.length > 0) {
        // Group measurements by cell
        const cellData = {};
        powerMeasurements.forEach(measurement => {
          if (!cellData[measurement.cellId]) {
            cellData[measurement.cellId] = [];
          }
          cellData[measurement.cellId].push(measurement);
        });

        // Create new chart data objects
        const newVChartData = {
          labels: [],
          datasets: []
        };
        const newPwrChartData = {
          labels: [],
          datasets: []
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
          const timestamps = sortedMeasurements.map(m => m.timestamp * 1000);
          const voltages = sortedMeasurements.map(m => m.data.voltage);
          const currents = sortedMeasurements.map(m => m.data.current);
          const powers = sortedMeasurements.map(m => m.data.voltage * m.data.current);

          // Create datasets
          const vData = createDataset(timestamps, voltages);
          const iData = createDataset(timestamps, currents);
          const pData = createDataset(timestamps, powers);

          // Add voltage/current datasets
          newVChartData.labels = timestamps;
          newVChartData.datasets.push(
            {
              label: name + ' Voltage (mV)',
              data: vData,
              borderColor: vColors[selectCounter],
              borderWidth: 2,
              fill: false,
              yAxisID: 'vAxis',
              radius: 2,
              pointRadius: 1,
            },
            {
              label: name + ' Current (µA)',
              data: iData,
              borderColor: iColors[selectCounter],
              borderWidth: 2,
              fill: false,
              yAxisID: 'cAxis',
              radius: 2,
              pointRadius: 1,
            },
          );

          // Add power dataset
          newPwrChartData.labels = timestamps;
          newPwrChartData.datasets.push({
            label: name + ' Power (µW)',
            data: pData,
            borderColor: pColors[selectCounter],
            borderWidth: 2,
            fill: false,
            radius: 2,
            pointRadius: 1,
          });

          selectCounter++;
        }

        if (hasAnyData) {
          setVChartData({ ...newVChartData });
          setPwrChartData({ ...newPwrChartData });
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
  }, [cells, stream, resample, startDate, endDate, historicalPowerByCell, centralHistoricalActive, historicalLoading]);


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

  const voltageChart = (
    <VChart
      data={vChartData}
      stream={stream}
      {...(!stream && { startDate, endDate })}
      onResampleChange={handleResampleChange}
    />
  );

  const powerChart = (
    <PwrChart
      data={pwrChartData}
      stream={stream}
      {...(!stream && { startDate, endDate })}
      onResampleChange={handleResampleChange}
    />
  );

  if (variant === 'voltage') {
    return (
      <Box sx={panelChartSx}>
        {voltageChart}
      </Box>
    );
  }

  if (variant === 'power') {
    return (
      <Box sx={panelChartSx}>
        {powerChart}
      </Box>
    );
  }

  return (
    <>
      <Grid item sx={{ height: chartHeight }} xs={12} sm={12} md={stream ? 12 : 6} p={3}>
        {voltageChart}
      </Grid>
      <Grid item sx={{ height: chartHeight }} xs={12} sm={12} md={stream ? 12 : 6} p={3}>
        {powerChart}
      </Grid>
    </>
  );
}

PowerCharts.propTypes = {
  cells: PropTypes.array,
  startDate: PropTypes.any,
  endDate: PropTypes.any,
  stream: PropTypes.bool,
  liveData: PropTypes.array,
  processedData: PropTypes.object,
  onDataStatusChange: PropTypes.func,
  variant: PropTypes.oneOf(['both', 'voltage', 'power']),
  historicalPowerByCell: PropTypes.object,
  centralHistoricalActive: PropTypes.bool,
  historicalLoading: PropTypes.bool,
};

export default PowerCharts;
