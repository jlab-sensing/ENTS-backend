import AddCircleIcon from '@mui/icons-material/AddCircle';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, IconButton, Modal, TextField, Typography, Select, MenuItem, FormControl, InputLabel} from '@mui/material';
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
  const [devEui, setDevEui] = useState('');  // Changed to match TTN API
  const [joinEui, setJoinEui] = useState('');  // Added for TTN integration
  const [appKey, setAppKey] = useState('');  // TTN App Key (sensitive)
  const [description, setDescription] = useState('');
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
    setDevEui('');
    setJoinEui('');
    setAppKey('');
    setDescription('');
  };

  const handleClose = () => {
    setOpen(false);
    // Reset states when closing via X button
    setResponse(null);
    setError(null);
    setName('');
    setType('');
    setDevEui('');
    setJoinEui('');
    setAppKey('');
    setDescription('');
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
            width: 450,
            bgcolor: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: 'none',
            overflow: 'hidden',
          }}
          component='form'
        >
          {error == null && response == null && (
            <>
              {/* Header Section */}
              <Box sx={{ 
                backgroundColor: '#588157', 
                padding: '1.5rem 2rem',
                position: 'relative',
                mb: 0
              }}>
                <IconButton
                  sx={{ 
                    position: 'absolute', 
                    top: '0.75rem', 
                    right: '0.75rem',
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                  }}
                  aria-label='close'
                  size='small'
                  onClick={handleClose}
                >
                  <CloseIcon fontSize='small' />
                </IconButton>
                <Typography 
                  variant='h5' 
                  component='h2'
                  sx={{ 
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1.5rem'
                  }}
                >
                  Add New Logger
                </Typography>
                <Typography 
                  variant='body2' 
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    mt: 0.5
                  }}
                >
                  Configure your environmental sensor logger
                </Typography>
              </Box>

              {/* Form Section */}
              <Box sx={{ padding: '2rem' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <TextField
                    label='Logger Name'
                    variant='outlined'
                    fullWidth
                    required
                    error={name.length === 0}
                    helperText={!name.length ? 'Logger name is required' : ''}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      }
                    }}
                  />
                  <FormControl required fullWidth>
                    <InputLabel id='type-label'>Logger Type</InputLabel>
                  <Select
                    label='Logger Type'
                    variant='outlined'
                    fullWidth
                    required
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    placeholder='Select a logger type'
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      }
                    }}
                  >
                      <MenuItem value='ents'>EnTS</MenuItem>
                      <MenuItem value='other'>Other</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField 
                    label='Device EUI'
                    variant='outlined'
                    fullWidth
                    required
                    value={devEui}
                    onChange={(e) => setDevEui(e.target.value)}
                    placeholder='e.g., 0080E1150546D093'
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      }
                    }}
                  />
                  <TextField
                    label='Join EUI'
                    variant='outlined'
                    fullWidth
                    required
                    value={joinEui}
                    onChange={(e) => setJoinEui(e.target.value)}
                    placeholder='e.g., 0101010101010101'
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      }
                    }}
                  />
                  <TextField
                    label='App Key'
                    variant='outlined'
                    fullWidth
                    required
                    value={appKey}
                    onChange={(e) => setAppKey(e.target.value)}
                    placeholder='Application Key'
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      }
                    }}
                  />
                  <TextField
                    label='Description'
                    variant='outlined'
                    fullWidth
                    multiline
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder='Describe the logger location and purpose'
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      }
                    }}
                  />
                </Box>

                {/* Action Buttons */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: '0.75rem', 
                  justifyContent: 'flex-end',
                  mt: '2rem',
                  pt: '1.5rem',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <Button
                    variant='outlined'
                    onClick={handleClose}
                    sx={{
                      borderColor: '#ddd',
                      color: '#666',
                      '&:hover': {
                        borderColor: '#bbb',
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='contained'
                    onClick={() => {
                      addLogger(name, type, devEui, joinEui, appKey, description, user.email)
                        .then((res) => {
                          setResponse({ ...res, name, type, devEui, description });
                          refetch();
                        })
                        .catch((error) => {
                          setError(error);
                          console.error(error);
                        });
                    }}
                    disabled={!name.trim() || !devEui.trim() || !joinEui.trim() || !appKey.trim()}
                    sx={{
                      backgroundColor: '#588157',
                      '&:hover': { backgroundColor: '#3a5a40' },
                      '&:disabled': { 
                        backgroundColor: '#ccc',
                        color: '#888'
                      },
                      borderRadius: '8px',
                      px: '1.5rem'
                    }}
                  >
                    Add Logger
                  </Button>
                </Box>
              </Box>
            </>
          )}
          {error ? (
            <>
              {/* Error Header */}
              <Box sx={{ 
                backgroundColor: '#d32f2f', 
                padding: '1.5rem 2rem',
                position: 'relative',
                mb: 0
              }}>
                <IconButton
                  sx={{ 
                    position: 'absolute', 
                    top: '0.75rem', 
                    right: '0.75rem',
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                  }}
                  aria-label='close'
                  size='small'
                  onClick={handleClose}
                >
                  <CloseIcon fontSize='small' />
                </IconButton>
                <Typography 
                  variant='h5' 
                  component='h2'
                  sx={{ 
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1.5rem'
                  }}
                >
                  Error Creating Logger
                </Typography>
              </Box>

              {/* Error Content */}
              <Box sx={{ padding: '2rem' }}>
                <Typography variant='body1' sx={{ mb: 3, color: '#666', lineHeight: 1.6 }}>
                  Duplicate logger names or other error occurred. Please try again with a different name.
                </Typography>
                <Button 
                  variant='contained'
                  onClick={handleClose}
                  sx={{
                    backgroundColor: '#d32f2f',
                    '&:hover': { backgroundColor: '#b71c1c' },
                    borderRadius: '8px',
                    width: '100%',
                    py: '0.75rem'
                  }}
                >
                  Close
                </Button>
              </Box>
            </>
          ) : (
            response && (
              <>
                {/* Success Header */}
                <Box sx={{ 
                  backgroundColor: '#2e7d32', 
                  padding: '1.5rem 2rem',
                  position: 'relative',
                  mb: 0
                }}>
                  <Typography 
                    variant='h5' 
                    component='h2'
                    sx={{ 
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '1.5rem'
                    }}
                  >
                    Logger Created Successfully!
                  </Typography>
                  <Typography 
                    variant='body2' 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      mt: 0.5
                    }}
                  >
                    Your environmental sensor logger has been configured
                  </Typography>
                </Box>

                {/* Success Content */}
                <Box sx={{ padding: '2rem' }}>
                  <Box sx={{ 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '8px', 
                    padding: '1.5rem',
                    mb: '1.5rem'
                  }}>
                    <Typography variant='h6' sx={{ mb: 2, color: '#2e7d32', fontWeight: 600 }}>
                      Logger Details
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <Box>
                        <Typography variant='body2' sx={{ color: '#666', fontWeight: 500 }}>
                          Name
                        </Typography>
                        <Typography variant='body1' sx={{ color: '#333' }}>
                          {response.name}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant='body2' sx={{ color: '#666', fontWeight: 500 }}>
                          Type
                        </Typography>
                        <Typography variant='body1' sx={{ color: '#333' }}>
                          {response.type || 'Not specified'}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant='body2' sx={{ color: '#666', fontWeight: 500 }}>
                          Device EUI
                        </Typography>
                        <Typography variant='body1' sx={{ color: '#333' }}>
                          {response.deviceEui || 'Not specified'}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant='body2' sx={{ color: '#666', fontWeight: 500 }}>
                          Description
                        </Typography>
                        <Typography variant='body1' sx={{ color: '#333' }}>
                          {response.description || 'No description provided'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Button
                    variant='contained'
                    onClick={DoneButtonClose}
                    sx={{
                      backgroundColor: '#2e7d32',
                      '&:hover': { backgroundColor: '#1b5e20' },
                      borderRadius: '8px',
                      width: '100%',
                      py: '0.75rem',
                      fontSize: '1rem',
                      fontWeight: 500,
                    }}
                  >
                    Done
                  </Button>
                </Box>
              </>
            )
          )}
        </Box>
      </Modal>
    </>
  );
}

export default AddLoggerModal;