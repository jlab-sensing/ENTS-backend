import PropTypes from 'prop-types';
import { React } from 'react';
import UniversalChart from '../UniversalChart';

export default function PwrChart({ data, stream, startDate, endDate, onResampleChange }) {
  return (
    <UniversalChart
      data={data}
      stream={stream}
      chartId='pwr'
      measurements={['Power']}
      units={['µW']}
      axisIds={['y']}
      startDate={startDate}
      endDate={endDate}
      onResampleChange={onResampleChange}
    />
  );
}

PwrChart.propTypes = {
  data: PropTypes.object,
  stream: PropTypes.bool,
  startDate: PropTypes.object,
  endDate: PropTypes.object,
  onResampleChange: PropTypes.func,
};
