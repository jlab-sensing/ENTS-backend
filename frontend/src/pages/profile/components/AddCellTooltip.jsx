import { React } from 'react';
import { Button } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';

function AddCellToolTip({ setOpen }) {
  return (
    <Button sx={{ color: 'black' }} key='prev' onClick={() => setOpen(true)}>
      <AddCircleIcon />
    </Button>
  );
}

export default AddCellToolTip;
