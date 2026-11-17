import AddCircleIcon from '@mui/icons-material/AddCircle';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Input,
  Modal,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { addLogger } from '../../../services/logger';
import { IMaskInput } from 'react-imask';
import PropTypes from 'prop-types';

////////////////////////////////////////////
const ShortTextMask = React.forwardRef(function TextMaskCustom(props, ref) {
  const { onChange, ...other } = props;
  return (
    <IMaskInput
      {...other}
      mask='**:**:**:**:**:**:**:**' //DevEUI
      inputRef={ref}
      onAccept={(value) => onChange({ target: { name: props.name, value } })}
      overwrite
    />
  );
});

ShortTextMask.propTypes = {
  name: PropTypes.string,
  onChange: PropTypes.func,
};

const cleanHexLike = (value) => (value || '').replace(/[^a-zA-Z0-9]/g, '');

const isValidEui64 = (value) => /^[0-9a-fA-F]{16}$/.test(value);

function AddLoggerModal() {
  let data = useOutletContext();
  const refetch = data[9]; // Logger refetch function from outlet context
  const user = data[4];
  const axiosPrivate = data[10];

  const [isOpen, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [type, setType] = useState('');
  const [devEui, setDevEui] = useState(''); // Changed to match TTN API
  const [description, setDescription] = useState('');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);

  const handleOpen = () => {
    setOpen(true);
    setResponse(null);
    setError(null);
    setConfirmOpen(false);
    setPendingSubmit(null);
  };

  const DoneButtonClose = () => {
    // Close modal and reset all states
    setOpen(false);
    setResponse(null);
    setError(null);
    setName('');
    setNameTouched(false);
    setType('');
    setDevEui('');
    setDescription('');
    setConfirmOpen(false);
    setPendingSubmit(null);
  };

  const handleClose = () => {
    setOpen(false);
    // Reset states when closing via X button
    setResponse(null);
    setError(null);
    setName('');
    setNameTouched(false);
    setType('');
    setDevEui('');
    setDescription('');
    setConfirmOpen(false);
    setPendingSubmit(null);
  };

  if (!user) {
    return <></>;
  }

  const cleanDevEui = cleanHexLike(devEui);

  const devEuiTyped = Boolean(cleanDevEui);

  const devEuiInvalid = devEuiTyped && !isValidEui64(cleanDevEui);
  const nameInvalid = nameTouched && !name.trim();

  const submitLogger = ({ submitDevEui }) => {
    addLogger(name, type, submitDevEui, description, user.email, axiosPrivate)
      .then((res) => {
        setResponse({
          ...res,
          name,
          type,
          devEui: submitDevEui || '',
          description,
        });
        refetch();
      })
      .catch((error) => {
        setError(error);
        console.error(error);
      });
  };

  const handleAddLogger = () => {
    const typeIsEnts = (type || '').toLowerCase() === 'ents';
    const submitDevEui = isValidEui64(cleanDevEui) ? cleanDevEui : undefined;

    if (typeIsEnts && !submitDevEui) {
      setPendingSubmit({ submitDevEui });
      setConfirmOpen(true);
      return;
    }

    submitLogger({ submitDevEui });
  };

  return (
    <>
      <Button sx={{ color: 'black' }} key='prev' onClick={handleOpen} aria-label='add logger'>
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
          <Dialog
            open={confirmOpen}
            onClose={() => {
              setConfirmOpen(false);
              setPendingSubmit(null);
            }}
            aria-labelledby='lorawan-confirm-title'
            aria-describedby='lorawan-confirm-desc'
          >
            <DialogTitle id='lorawan-confirm-title'>Create Logger Without LoRaWAN?</DialogTitle>
            <DialogContent>
              <DialogContentText id='lorawan-confirm-desc'>
                The Device EUI is missing or invalid. If you continue, the logger will be created in DirtViz but it will
                not be registered on The Things Network (LoRaWAN).
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                variant='outlined'
                onClick={() => {
                  setConfirmOpen(false);
                  setPendingSubmit(null);
                }}
              >
                Go Back
              </Button>
              <Button
                variant='contained'
                onClick={() => {
                  const next = pendingSubmit || { submitDevEui: undefined };
                  setConfirmOpen(false);
                  setPendingSubmit(null);
                  submitLogger(next);
                }}
                sx={{ backgroundColor: '#588157', '&:hover': { backgroundColor: '#3a5a40' } }}
              >
                Continue
              </Button>
            </DialogActions>
          </Dialog>

          {error == null && response == null && (
            <>
              {/* Header Section */}
              <Box
                sx={{
                  backgroundColor: '#588157',
                  padding: '1.5rem 2rem',
                  position: 'relative',
                  mb: 0,
                }}
              >
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
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
                    fontSize: '1.5rem',
                  }}
                >
                  Add New Logger
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    mt: 0.5,
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
                    error={nameInvalid}
                    helperText={nameInvalid ? 'Logger name is required' : ''}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setNameTouched(true)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      },
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
                        },
                      }}
                    >
                      <MenuItem value='ents'>EnTS</MenuItem>
                      <MenuItem value='other'>Other</MenuItem>
                    </Select>
                  </FormControl>
                  {/* Change the following three text fields to follow this format
                  
                  <FormControl variant="standard">
                  <InputLabel htmlFor="formatted-text-mask-input">react-imask</InputLabel>
                  <Input
                    onChange={handleChange}
                    name="textmask"
                    id="formatted-text-mask-input"
                    inputComponent={TextMaskCustom}
                  />
                </FormControl>


                You will need to create the TextMaskCustom function above to have this desired functionality

                see https://github.com/jlab-sensing/ENTS-backend/issues/512 for more
                */}
                  {/* THIS IS WHERE THE Device EUI Code is*/}
                  <FormControl variant='standard'>
                    <InputLabel>Device EUI</InputLabel>
                    <Input
                      onChange={(e) => setDevEui(e.target.value)}
                      name='deviceEUI'
                      variant='outlined'
                      fullWidth
                      value={devEui}
                      placeholder='e.g., 0080E1150546D093'
                      inputComponent={ShortTextMask}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                        },
                      }}
                    />
                    <FormHelperText error={devEuiInvalid}>
                      Optional. 16 hex characters (EUI64). {devEuiInvalid ? 'Invalid Device EUI.' : ''}
                    </FormHelperText>
                  </FormControl>
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
                      },
                    }}
                  />
                </Box>

                {/* Action Buttons */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: 'flex-end',
                    mt: '2rem',
                    pt: '1.5rem',
                    borderTop: '1px solid #f0f0f0',
                  }}
                >
                  <Button
                    variant='outlined'
                    onClick={handleClose}
                    sx={{
                      borderColor: '#ddd',
                      color: '#666',
                      '&:hover': {
                        borderColor: '#bbb',
                        backgroundColor: '#f5f5f5',
                      },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='contained'
                    onClick={handleAddLogger}
                    disabled={!name.trim() || !(type || '').trim()}
                    sx={{
                      backgroundColor: '#588157',
                      '&:hover': { backgroundColor: '#3a5a40' },
                      '&:disabled': {
                        backgroundColor: '#ccc',
                        color: '#888',
                      },
                      borderRadius: '8px',
                      px: '1.5rem',
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
              <Box
                sx={{
                  backgroundColor: '#d32f2f',
                  padding: '1.5rem 2rem',
                  position: 'relative',
                  mb: 0,
                }}
              >
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
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
                    fontSize: '1.5rem',
                  }}
                >
                  Error Creating Logger
                </Typography>
              </Box>

              {/* Error Content */}
              <Box sx={{ padding: '2rem' }}>
                <Typography variant='body1' sx={{ mb: 3, color: '#666', lineHeight: 1.6 }}>
                  {error?.response?.data?.message || error?.message || 'An unknown error occurred. Please try again.'}
                </Typography>
                <Button
                  variant='contained'
                  onClick={handleClose}
                  sx={{
                    backgroundColor: '#d32f2f',
                    '&:hover': { backgroundColor: '#b71c1c' },
                    borderRadius: '8px',
                    width: '100%',
                    py: '0.75rem',
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
                <Box
                  sx={{
                    backgroundColor: '#2e7d32',
                    padding: '1.5rem 2rem',
                    position: 'relative',
                    mb: 0,
                  }}
                >
                  <Typography
                    variant='h5'
                    component='h2'
                    sx={{
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '1.5rem',
                    }}
                  >
                    Logger Created Successfully!
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      mt: 0.5,
                    }}
                  >
                    Your environmental sensor logger has been configured
                  </Typography>
                </Box>

                {/* Success Content */}
                <Box sx={{ padding: '2rem' }}>
                  <Box
                    sx={{
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      mb: '1.5rem',
                    }}
                  >
                    <Typography variant='h6' sx={{ mb: 2, color: '#2e7d32', fontWeight: 600 }}>
                      Logger Details
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <Box>
                        <Typography variant='body2' sx={{ color: '#666', fontWeight: 500 }} component='span'>
                          Name:{' '}
                        </Typography>
                        <Typography variant='body1' sx={{ color: '#333' }} component='span'>
                          {response.name}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant='body2' sx={{ color: '#666', fontWeight: 500 }} component='span'>
                          Type:{' '}
                        </Typography>
                        <Typography variant='body1' sx={{ color: '#333' }} component='span'>
                          {response.type || 'Not specified'}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant='body2' sx={{ color: '#666', fontWeight: 500 }} component='span'>
                          Device EUI:{' '}
                        </Typography>
                        <Typography variant='body1' sx={{ color: '#333' }} component='span'>
                          {response.devEui || 'Not set'}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant='body2' sx={{ color: '#666', fontWeight: 500 }} component='span'>
                          Description:{' '}
                        </Typography>
                        <Typography variant='body1' sx={{ color: '#333' }} component='span'>
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
