import { React } from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import HorizontalRuleRoundedIcon from '@mui/icons-material/HorizontalRuleRounded';
import PropTypes from 'prop-types';

function DateRangeSel(props) {
  const startDate = props.startDate;
  const endDate = props.endDate;
  return (
    <>
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <DateTimePicker
          label='Start Date'
          value={startDate}
          onChange={(newStartDate) => props.setStartDate(newStartDate)}
          views={['year', 'month', 'day', 'hours']}
        />
      </LocalizationProvider>
      <HorizontalRuleRoundedIcon sx={{ mr: 1, ml: 1 }} />
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <DateTimePicker
          label='End Date'
          value={endDate}
          onChange={(newEndDate) => props.setEndDate(newEndDate)}
          views={['year', 'month', 'day', 'hours']}
        />
      </LocalizationProvider>
    </>
  );
}

DateRangeSel.propTypes = {
  startDate: PropTypes.any,
  endDate: PropTypes.any,
  setStartDate: PropTypes.func.isRequired,
  setEndDate: PropTypes.func.isRequired,
};

export default DateRangeSel;
