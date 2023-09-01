import { React } from 'react';
import PropTypes from 'prop-types';

function CellSelect(props) {
  const startDate = props.startDate;
  const endDate = props.endDate;
  return (
    <>
      <FormControl sx={{ width: 1 / 4 }}>
        <InputLabel id='cell-select'>Cell</InputLabel>
        {selectedCells && (
          <Select
            labelId='cell-select-label'
            id='cell-select'
            value={selectedCells}
            multiple
            label='Cell'
            defaultValue={selectedCells}
            onChange={(e) => {
              setSelectedCells(e.target.value);
            }}
          >
            {Array.isArray(cellIds)
              ? cellIds.map((cell) => {
                  return (
                    <MenuItem value={cell} key={cell.id}>
                      {cell.name}
                    </MenuItem>
                  );
                })
              : ''}
          </Select>
        )}
      </FormControl>
    </>
  );
}

DateRangeSel.propTypes = {
  startDate: PropTypes.any,
  endDate: PropTypes.any,
  setStartDate: PropTypes.func.isRequired,
  setEndDate: PropTypes.func.isRequired,
};

export default CellSelect;
