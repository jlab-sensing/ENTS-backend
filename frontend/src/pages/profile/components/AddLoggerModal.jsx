import AddCircleIcon from '@mui/icons-material/AddCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, IconButton, Modal, TextField, Typography } from '@mui/material';
import { React, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { addLogger } from '../../../services/logger';

function AddLoggerModal() {
  let data = useOutletContext();
  const refetch = data[9]; // Logger refetch function from outlet context
  const user = data[4];
  
  const [isOpen, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [deviceEui, setDeviceEui] = useState('');
  const [description, setDescription] = useState('');
  const [appKey, setAppKey] = useState(''); // App Key field for UI only
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleOpen = () => {
    setOpen(true);
    setResponse(null);
    setError(null);
  };

  const DoneButtonClose = () => {
    // Close modal and reset all states
    setOpen(false);
    setResponse(null);
    setError(null);
    setName('');
    setType('');
    setDeviceEui('');
    setDescription('');
    setAppKey('');
  };

  const handleClose = () => {
    setOpen(false);
    // Reset states when closing via X button
    setResponse(null);
    setError(null);
    setName('');
    setType('');
    setDeviceEui('');
    setDescription('');
    setAppKey('');
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
            p: 4,
          }}
          component='form'
        >
          {error == null && response == null && (
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
                Logger Info
              </Typography>
              <Typography sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                  label='Type'
                  variant='outlined'
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                  }}
                />
                <TextField
                  id='outlined-basic'
                  label='Device EUI'
                  variant='outlined'
                  value={deviceEui}
                  onChange={(e) => {
                    setDeviceEui(e.target.value);
                  }}
                />
                <TextField
                  id='outlined-basic'
                  label='Description'
                  variant='outlined'
                  multiline
                  rows={2}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                  }}
                />
                <TextField
                  id='outlined-basic'
                  label='App Key'
                  variant='outlined'
                  value={appKey}
                  onChange={(e) => {
                    setAppKey(e.target.value);
                  }}
                  helperText='App Key for future API integration'
                />
              </Typography>
              <Button
                onClick={() => {
                  // Note: App Key is not sent to backend - saved for future API integration
                  addLogger(name, type, deviceEui, description, user.email)
                    .then((res) => {
                      setResponse({ ...res, name, type, deviceEui, description });
                      refetch();
                    })
                    .catch((error) => {
                      setError(error);
                      console.error(error);
                    });
                }}
              >
                Add Logger
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
              <p>Duplicate logger names or other error occurred.</p>
              <Button onClick={handleClose}>Done</Button>
            </>
          ) : (
            response && (
              <>
                {/* Success Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 28 }} />
                  <Typography variant='h5' component='h2' sx={{ color: 'success.main', fontWeight: 'bold' }}>
                    Logger Created Successfully!
                  </Typography>
                </Box>

                {/* Logger Details */}
                <Typography variant='h6' sx={{ mb: 2, color: 'text.primary' }}>
                  Logger Name: <strong>{response.name}</strong>
                </Typography>
                
                <Typography variant='body1' sx={{ mb: 1, color: 'text.secondary' }}>
                  Type: {response.type || 'Not specified'}
                </Typography>
                
                <Typography variant='body1' sx={{ mb: 1, color: 'text.secondary' }}>
                  Device EUI: {response.deviceEui || 'Not specified'}
                </Typography>
                
                <Typography variant='body1' sx={{ mb: 3, color: 'text.secondary' }}>
                  Description: {response.description || 'No description provided'}
                </Typography>

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
            )
          )}
        </Box>
      </Modal>
    </>
  );
}

export default AddLoggerModal;