import { React, useState } from 'react';
import { useCells } from '../../../services/cell';
import { FormControl, InputLabel, Select, MenuItem, IconButton, Menu } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import PropTypes from 'prop-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

function CellSelect({ selectedCells, setSelectedCells }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const queryClient = useQueryClient();
  const cells = useCells();

  const handleMenuClick = (event, cell) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedCell(cell);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCell(null);
  };

  const deleteMutation = useMutation({
    mutationFn: (cellId) => axios.delete(`/api/cell/${cellId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['cells']);
      handleMenuClose();
    },
  });

  const handleDelete = (event) => {
    event.stopPropagation();
    if (window.confirm('Are you sure you want to delete this cell?')) {
      deleteMutation.mutate(selectedCell.id);
    }
  };
  if (cells.isLoading) {
    return <span>Loading...</span>;
  }

  if (cells.isError) {
    return <span>Error: {cells.error.message}</span>;
  }
  return (
    <FormControl sx={{ width: 1 }}>
      <InputLabel id='cell-select'>Cell</InputLabel>
      <Select
        labelId='cell-select-label'
        id='cell-select'
        value={selectedCells}
        multiple
        label='select-cell'
        defaultValue={selectedCells}
        onChange={(e) => {
          setSelectedCells(e.target.value);
        }}
      >
        {Array.isArray(cells.data)
          ? cells.data
              .filter((cell) => !cell.archive)
              .map((cell) => (
                <MenuItem 
                  value={cell} 
                  key={cell.id}
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  {cell.name}
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, cell)}
                    sx={{ ml: 2 }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </MenuItem>
              ))
          : ''}
        <MenuItem value='all' disabled={true} sx={{ color: 'black' }}>
          Can&apos;t find cell? Check Archive feature.
        </MenuItem>
      </Select>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Cell
        </MenuItem>
      </Menu>
    </FormControl>
  );
}

CellSelect.propTypes = {
  selectedCells: PropTypes.array,
  setSelectedCells: PropTypes.func.isRequired,
};

export default CellSelect;
