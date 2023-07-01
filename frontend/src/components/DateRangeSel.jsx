import { React, useState, useEffect } from "react";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { DateTime } from "luxon";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import HorizontalRuleRoundedIcon from "@mui/icons-material/HorizontalRuleRounded";
import PropTypes from "prop-types";

function DateRangeSel(props) {
  const [startDate, setStartDate] = useState(
    DateTime.now().minus({ months: 1 })
  );
  useEffect(() => {
    console.log(startDate);
  }, [startDate]);
  const [endDate, setEndDate] = useState(DateTime.now());
  useEffect(() => {
    console.log(endDate);
  }, [endDate]);
  return (
    <>
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <DateTimePicker
          label="Start Date"
          value={startDate}
          onChange={(startDate) => setStartDate(startDate)}
          views={["year", "month", "day", "hours"]}
        />
      </LocalizationProvider>
      <HorizontalRuleRoundedIcon sx={{ mr: 1, ml: 1 }} />
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <DateTimePicker
          label="End Date"
          value={endDate}
          onChange={(endDate) => setEndDate(endDate)}
          views={["year", "month", "day", "hours"]}
        />
      </LocalizationProvider>
    </>
  );
}

DateRangeSel.propTypes = {
  startDate: DateTime,
  endDate: DateTime,
};

export default DateRangeSel;
