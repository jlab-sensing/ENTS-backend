import AddCircleIcon from '@mui/icons-material/AddCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Chip, IconButton, Modal, TextField, Typography } from '@mui/material';
import { React, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { addCell } from '../../../services/cell';

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
  const [error, setError] = useState(null);
  
  const handleOpen = () => {
    setOpen(true);
    setResponse(null);
  };

  const DoneButtonClose = () => {
    // Close modal and reset all states
    setOpen(false);
    setError(null);
    setResponse(null);
    setName('');
    setLocation('');
    setLong('');
    setLat('');
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    // Reset states when closing via X button
    setResponse(null);
    setName('');
    setLocation('');
    setLong('');
    setLat('');
  };



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
            p: 4
          }}
          component='form'
        >
          {(error == null && response == null) && (
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
                  label='Latitude'
                  variant='outlined'
                  error={lat.length === 0 || isNaN(Number(lat))}
                  helperText={!lat.length ? 'latitude is required' : isNaN(Number(lat)) ? 'Please Enter Numbers' : ''}
                  value={lat}
                  onChange={(e) => {
                    setLat(e.target.value);
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
              </Typography>
              <Button
                onClick={() => {
                  addCell(name, location, long, lat, archive, user.email)
                    .then((res) => {
                      setResponse(res);
                      refetch();
                    })
                    .catch((error) => {
                      setError(error);
                      console.error(error);
                    })
                }}
              >
                Add Cell
              </Button>
            </>
          )}

          {error ? (
            <>
              <IconButton
                sx={{ position: 'absolute', top: 5, right: 5 }}
                aria-label='delete'
                size='small'
                onClick={handleClose}
              >
                <CloseIcon fontSize='small' />
              </IconButton>
              <h1>Error</h1>
              <p>
                Duplicate cell names.
              </p>
              <Button onClick={handleClose}>Done</Button>
            </>
          ) : response && (
            <>
              <IconButton
                sx={{ position: 'absolute', top: 5, right: 5 }}
                aria-label='delete'
                size='small'
                onClick={handleClose}
              >
                <CloseIcon fontSize='small' />
              </IconButton>

              {/* Success Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <CheckCircleIcon sx={{ color: 'success.main', fontSize: 28 }} />
                <Typography variant='h5' component='h2' sx={{ color: 'success.main', fontWeight: 'bold' }}>
                  Cell Created Successfully!
                </Typography>
              </Box>

              {/* Cell Name */}
              <Typography variant='h6' sx={{ mb: 2, color: 'text.primary' }}>
                Cell Name: <strong>{response.name}</strong>
              </Typography>

              {/* API Endpoints Section */}
              <Typography variant='h6' sx={{ mb: 2, color: 'text.primary' }}>
                API Endpoints:
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                {/* Power Data Endpoint */}
                <Box>
                  <Chip label='Power Data' color='primary' variant='outlined' size='small' sx={{ mb: 1 }} />
                  <Typography variant='body2' sx={{ mb: 1, mt: 1, color: 'text.secondary' }}>
                    Here&apos;s the endpoint to start uploading power data:
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{
                      fontFamily: 'monospace',
                      backgroundColor: 'grey.100',
                      p: 1,
                      borderRadius: 1,
                      wordBreak: 'break-all',
                      userSelect: 'all',
                    }}
                  >
                    https://dirtviz.jlab.ucsc.edu/api/sensor/{response.id}
                  </Typography>
                </Box>

                {/* TEROS Data Endpoint */}
                <Box>
                  <Chip label='TEROS Data' color='secondary' variant='outlined' size='small' sx={{ mb: 1 }} />
                  <Typography variant='body2' sx={{ mb: 1, mt: 1, color: 'text.secondary' }}>
                    Here&apos;s the endpoint to start uploading TEROS data:
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{
                      fontFamily: 'monospace',
                      backgroundColor: 'grey.100',
                      p: 1,
                      borderRadius: 1,
                      wordBreak: 'break-all',
                      userSelect: 'all',
                    }}
                  >
                    https://dirtviz.jlab.ucsc.edu/api/sensor/{response.id}
                  </Typography>
                </Box>
              </Box>

              {/* Done Button */}
              <Button
                variant='contained'
                color='success'
                onClick={DoneButtonClose}
                sx={{
                  width: '100%',
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                }}
              >
                Done
              </Button>

            </>
          )}
        </Box>
      </Modal>
    </>
  );
}

export default AddCellModal;
