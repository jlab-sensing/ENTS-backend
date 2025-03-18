import { React, useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, TextField, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { addCell } from '../../../services/cell';
import { useOutletContext } from 'react-router-dom';

function AddCellModal() {
  let data = useOutletContext();
  const refetch = data[3];
  const user = data[4];
  data = data[0];
  const [isOpen, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [long, setLong] = useState('');
  const [lat, setLat] = useState('');
  const archive = false;
  const [response, setResponse] = useState(null);
  const [setCloseDonebutton] = useState(true);
  const handleOpen = () => {
    setOpen(true);
    setResponse(null);
  };

  const DoneButtonClose = () => {
    setCloseDonebutton(false);
    setOpen(false);
  };

  const handleClose = () => setOpen(false);
  useEffect(() => {
    console.log(response);
  }, [response]);
  if (!user) {
    return <></>;
  }
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
          {response == null && (
            <>
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
                  error={long.length === 0 || isNaN(Number(long))}
                  helperText={
                    !long.length ? 'longitude is required' : isNaN(Number(long)) ? 'Please Enter Numbers' : ''
                  }
                  value={long}
                  onChange={(e) => {
                    setLong(e.target.value);
                  }}
                />
                <TextField
                  id='outlined-basic'
                  label='Latitude'
                  variant='outlined'
                  error={lat.length === 0 || isNaN(Number(lat))}
                  helperText={!lat.length ? 'latitude is required' : isNaN(Number(lat)) ? 'Please Enter Numbers' : ''}
                  value={lat}
                  onChange={(e) => {
                    setLat(e.target.value);
                  }}
                />
              </Typography>
              <Button
                onClick={() => {
                  addCell(name, location, long, lat, archive, user.email)
                    .then((res) => {
                      setResponse(res);
                      refetch();
                    })
                    .catch((error) => console.error(error));
                }}
              >
                Add Cell
              </Button>
            </>
          )}

          {response && (
            <>
              <IconButton
                sx={{ position: 'absolute', top: 5, right: 5 }}
                aria-label='delete'
                size='small'
                onClick={handleClose}
              >
                <CloseIcon fontSize='small' />
              </IconButton>
              <h1>Created new cell {response.name}</h1>
              <p>
                Here&apos;s the endpoint to start uploading power data, https://dirtviz.jlab.ucsc.edu/api/power/
                {response.id}
              </p>
              <p>
                Here&apos;,s the endpoint to start uploading teros data, https://dirtviz.jlab.ucsc.edu/api/teros/
                {response.id}
              </p>
              <Button onClick={DoneButtonClose}>Done</Button>
            </>
          )}
        </Box>
      </Modal>
    </>
  );
}

export default AddCellModal;
