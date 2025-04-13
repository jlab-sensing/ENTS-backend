import { MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import PropTypes from 'prop-types';

export default function CellMenu({ cell, handleClose }) {
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation({
    mutationFn: (cellId) => 
      axios.delete(`/api/cell/${cellId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['cells']);
      handleClose();
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this cell?')) {
      deleteMutation.mutate(cell.id);
    }
  };

  return (
    <>
      <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
        <DeleteIcon sx={{ mr: 1 }} />
        Delete Cell
      </MenuItem>
    </>
  );
}

CellMenu.propTypes = {
  cell: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  handleClose: PropTypes.func.isRequired,
};