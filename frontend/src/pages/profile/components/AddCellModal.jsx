import { React, useState } from 'react';
import { Modal, Box, Typography, Button, TextField, IconButton, FormControl } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { addCell } from '../../../services/cell';

function AddCellModal() {
  const [isOpen, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [long, setLong] = useState('');
  const [lat, setLat] = useState('');

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
          component='form'
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
            Cell Info
          </Typography>

          <Typography sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* name, location name, coordinates*/}
            <TextField
              id='outlined-basic'
              label='Name'
              variant='outlined'
              error={name.length === 0}
              helperText={!name.length ? 'name is required' : ''}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
            <TextField
              id='outlined-basic'
              label='Location'
              variant='outlined'
              error={location.length === 0}
              helperText={!location.length ? 'location is required' : ''}
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
              }}
            />
            <TextField
              id='outlined-basic'
              label='Longitude'
              variant='outlined'
              error={long.length === 0}
              helperText={!long.length ? 'longitude is required' : ''}
              value={long}
              onChange={(e) => {
                setLong(e.target.value);
              }}
            />
            <TextField
              id='outlined-basic'
              label='Latitude'
              variant='outlined'
              error={lat.length === 0}
              helperText={!lat.length ? 'latitude is required' : ''}
              value={lat}
              onChange={(e) => {
                setLat(e.target.value);
              }}
            />
          </Typography>
          <Button onClick={() => console.log(name, location, lat, long)}>Add Cell</Button>
        </Box>
      </Modal>
    </>
  );
}

export default AddCellModal;
