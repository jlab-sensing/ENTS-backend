import { Grid } from '@mui/material';
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import { React, useEffect, useState } from 'react';
import TempChart from '../../../charts/TempChart/TempChart';
import VwcChart from '../../../charts/VwcChart/VwcChart';
import { getTerosData } from '../../../services/teros';

function TerosCharts({ cells, startDate, endDate, stream, liveData, processedData, onDataStatusChange }) {
  const [resample, setResample] = useState('hour');
  const chartSettings = {
    datasets: [],
  };
  const [vwcChartData, setVwcChartData] = useState(chartSettings);
  const [tempChartData, setTempChartData] = useState(chartSettings);
  const [hasData, setHasData] = useState(false);

  // Access data for each cell and update the combined charts accordingly

  const tempColors = ['#26C6DA', '#FF7043', '#A2708A'];
  const ecColors = ['#26C6DA', '#FF7043', '#A2708A'];
  const vwcColors = ['#112E51', '#78909C', '#C1F7DC'];

  //** gets teros data from backend */
  async function getTerosChartData() {
    const data = {};
    // Always fetch data for all selected cells when cells change
    let loadCells = cells;
    for (const { id, name } of loadCells) {
      data[id] = {
        name: name,
        terosData: await getTerosData(id, startDate.toHTTP(), endDate.toHTTP(), resample),
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
      // Always process all selected cells
      let loadCells = cells;
      let hasAnyData = false;
      for (const { id } of loadCells) {
        const cellid = id;
        const name = cellChartData[cellid].name;
        const terosData = cellChartData[cellid].terosData;

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
      // Update loaded cells to track current selection
      setHasData(hasAnyData);
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
      const terosMeasurements = liveData.filter(measurement => 
        measurement.type === 'teros12' && 
        cells.some(cell => cell.id === measurement.cellId)
      );

      if (terosMeasurements.length > 0) {
        const cellData = {};
        terosMeasurements.forEach(measurement => {
          if (!cellData[measurement.cellId]) {
            cellData[measurement.cellId] = [];
          }
          cellData[measurement.cellId].push(measurement);
        });

        const newVwcChartData = {
          labels: [],
          datasets: []
        };
        const newTempChartData = {
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
          const vwcData = sortedMeasurements.map(m => m.data.vwcAdj * 100);
          const ecData = sortedMeasurements.map(m => m.data.ec);
          const tempData = sortedMeasurements.map(m => m.data.temp);

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
        <VwcChart
          data={vwcChartData}
          stream={stream}
          {...(!stream && { startDate, endDate })}
          onResampleChange={handleResampleChange}
        />
      </Grid>
      <Grid item sx={{ height: { xs: '400px', md: '450px' } }} xs={12} sm={12} md={stream ? 12 : 6} p={3}>
        <TempChart
          data={tempChartData}
          stream={stream}
          {...(!stream && { startDate, endDate })}
          onResampleChange={handleResampleChange}
        />
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
};

export default TerosCharts;
