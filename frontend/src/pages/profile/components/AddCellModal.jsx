import { React, useState } from 'react';
import { Modal, Box, Typography, Button, TextField, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleIcon from '@mui/icons-material/AddCircle';

function AddCellModal() {
  const [isOpen, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  return (
    <>
      <Button sx={{ color: 'black' }} key='prev' onClick={handleOpen}>
        <AddCircleIcon />
      </Button>
      <Modal
        open={isOpen}
        onClose={handleClose}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
          }}
        >
          <IconButton
            sx={{ position: 'absolute', top: 5, right: 5 }}
            aria-label='delete'
            size='small'
            onClick={handleClose}
          >
            <CloseIcon fontSize='small' />
          </IconButton>
          <Typography variant='h6' component='h2'>
            Add Cell
          </Typography>

          <Typography sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* name, location name, coordinates*/}
            <TextField id='outlined-basic' label='Name' variant='outlined' />
            <TextField id='outlined-basic' label='Location' variant='outlined' />
            <TextField id='outlined-basic' label='Coordinates' variant='outlined' />
          </Typography>
        </Box>
      </Modal>
    </>
  );
}

export default AddCellModal;
