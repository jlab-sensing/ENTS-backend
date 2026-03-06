import PropTypes from 'prop-types';
import { React } from 'react';
import UniversalChart from '../UniversalChart';

export default function VwcChart({ data, stream, startDate, endDate, onResampleChange }) {
  return (
    <UniversalChart
      data={data}
      stream={stream}
      chartId='vwc'
      measurements={['VWC', 'EC']}
      units={['%', 'µS/cm']}
      axisIds={['vwcAxis', 'ecAxis']}
      axisPolicy='vwcPercent'
      streamAutoSkip={false}
      dualAxisTickCount={10}
      dualAxisStepFactor={10}
      primaryAxisGrid={{ drawOnChartArea: false }}
      enableAxisPlugins={false}
      startDate={startDate}
      endDate={endDate}
      onResampleChange={onResampleChange}
    />
  );
}

VwcChart.propTypes = {
  data: PropTypes.object,
  stream: PropTypes.bool,
  startDate: PropTypes.object,
  endDate: PropTypes.object,
  onResampleChange: PropTypes.func,
};
