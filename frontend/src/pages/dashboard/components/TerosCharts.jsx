import { React } from 'react';
import { Grid } from '@mui/material';
import PropTypes from 'prop-types';
import VwcChart from '../../../charts/VwcChart/VwcChart';
import TempChart from '../../../charts/TempChart/TempChart';

function ChartLayout(vChartData, pwrChartData, vwcChartData, tempChartData) {
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

ChartLayout.propTypes = {
  vwcChartData: PropTypes.object,
  tempChartData: PropTypes.object,
};

export default ChartLayout;
