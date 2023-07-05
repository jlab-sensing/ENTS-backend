import { React } from "react";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { DateTime } from "luxon";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import HorizontalRuleRoundedIcon from "@mui/icons-material/HorizontalRuleRounded";

function DateRangeSel(props) {
  //   const [startDate, setStartDate] = useState(
  //     DateTime.now().minus({ months: 1 })
  //   );
  //   const [endDate, setEndDate] = useState(DateTime.now());
  //   useEffect(() => {
  //     console.log(startDate);
  //   }, [startDate]);

  //   useEffect(() => {
  //     console.log(endDate);
  //   }, [endDate]);
  return (
    <>
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <DateTimePicker
          label="Start Date"
          value={props.startDate}
          onChange={(startDate) => props.setStartDate(startDate)}
          views={["year", "month", "day", "hours"]}
        />
      </LocalizationProvider>
      <HorizontalRuleRoundedIcon sx={{ mr: 1, ml: 1 }} />
      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <DateTimePicker
          label="End Date"
          value={props.endDate}
          onChange={(endDate) => props.setEndDate(endDate)}
          views={["year", "month", "day", "hours"]}
        />
      </LocalizationProvider>
    </>
  );
}

DateRangeSel.propTypes = {
  startDate: DateTime,
  endDate: DateTime,
  setStartDate: Function,
  setEndDate: Function,
};

export default DateRangeSel;
