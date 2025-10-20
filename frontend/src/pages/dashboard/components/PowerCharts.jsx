import { Grid } from '@mui/material';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import { React, useEffect, useState } from 'react';
import PwrChart from '../../../charts/PwrChart/PwrChart';
import VChart from '../../../charts/VChart/VChart';
import { getPowerData } from '../../../services/power';
function PowerCharts({ cells, startDate, endDate, stream, liveData, processedData, onDataStatusChange }) {
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
  
  // Initialize the combined chart data with empty datasets

  const pColors = ['#26C6DA', '#FF7043', '#A2708A'];
  const vColors = ['#26C6DA', '#FF7043', '#A2708A'];
  const iColors = ['#112E51', '#78909C', '#C1F7DC'];

  //** gets power data from backend */
  async function getPowerChartData() {
    const data = {};
    // Always fetch data for all selected cells when cells change
    let loadCells = cells;
    for (const { id, name } of loadCells) {
      data[id] = {
        name: name,
        powerData: await getPowerData(id, startDate.toHTTP(), endDate.toHTTP(), resample),
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
    const newVChartData = {
      ...vChartData,
      datasets: [],
    };
    const newPwrChartData = {
      ...pwrChartData,
      datasets: [],
    };
    getPowerChartData().then((cellChartData) => {
      let selectCounter = 0;
      // Always process all selected cells
      let loadCells = cells;
      let hasAnyData = false;
      for (const { id } of loadCells) {
        const cellid = id;
        const name = cellChartData[cellid].name;
        const powerData = cellChartData[cellid].powerData;

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
          //power data
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
      // Update loaded cells to track current selection
      setHasData(hasAnyData);
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
  }, [cells, stream, resample, startDate, endDate]); // Added back startDate, endDate dependencies


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
      <Grid item sx={{ height: { xs: '400px', md: '450px' } }} xs={12} sm={12} md={stream ? 12 : 6} p={3}>
        <VChart
          data={vChartData}
          stream={stream}
          {...(!stream && { startDate, endDate })}
          onResampleChange={handleResampleChange}
        />
      </Grid>
      <Grid item sx={{ height: { xs: '400px', md: '450px' } }} xs={12} sm={12} md={stream ? 12 : 6} p={3}>
        <PwrChart
          data={pwrChartData}
          stream={stream}
          {...(!stream && { startDate, endDate })}
          onResampleChange={handleResampleChange}
        />
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
};

export default PowerCharts;
