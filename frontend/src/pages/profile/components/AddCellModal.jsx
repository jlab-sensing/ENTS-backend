import AddCircleIcon from '@mui/icons-material/AddCircle';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Chip, IconButton, Modal, TextField, Typography } from '@mui/material';
import { React, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { addCell } from '../../../services/cell';
import { useAssignCellTags } from '../../../services/tag';
import TagSelector from '../../../components/TagSelector';
import MetadataEditor from '../../../components/MetadataEditor';
import { rowsToMetadata } from '../../../components/metadataUtils';

function AddCellModal() {
  let data = useOutletContext();
  const refetch = data[3];
  const user = data[4];
  const axiosPrivate = data[6];
  data = data[0];
  const [isOpen, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [long, setLong] = useState('');
  const [lat, setLat] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [metadataRows, setMetadataRows] = useState([]);
  const archive = false;
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [IsSubmitted, setIsSubmitted] = useState(null);

  const assignCellTagsMutation = useAssignCellTags();
  const { metadata, rowErrors: metadataErrors, hasError: hasMetadataError } = rowsToMetadata(metadataRows);

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
    setLocation('');
    setLong('');
    setLat('');
    setSelectedTags([]);
    setMetadataRows([]);
  };

  const handleClose = () => {
    setOpen(false);
    // Reset states when closing via X button
    setResponse(null);
    setError(null);
    setName('');
    setLocation('');
    setLong('');
    setLat('');
    setSelectedTags([]);
    setMetadataRows([]);
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLong(position.coords.latitude.toString());
        setLat(position.coords.longitude.toString());
      });
    }
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
            width: 480,
            maxWidth: '92vw',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
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
                  Add New Cell
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    mt: 0.5,
                  }}
                >
                  Configure your environmental monitoring cell
                </Typography>
              </Box>

              {/* Form Section */}
              <Box sx={{ padding: '2rem', overflowY: 'auto' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <TextField
                    label='Cell Name'
                    variant='outlined'
                    fullWidth
                    required
                    error={name.length === 0 && IsSubmitted}
                    helperText={!(name.length) && (IsSubmitted) ? 'Cell name is required' : ''}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='e.g., Forest Station A'
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      },
                    }}
                  />
                  <TextField
                    label='Location'
                    variant='outlined'
                    fullWidth
                    required
                    error={location.length === 0 && IsSubmitted}
                    helperText={!(location.length) && (IsSubmitted) ? 'Location is required' : ''}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder='e.g., North Campus Field'
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      },
                    }}
                  />
                  <TextField
                    label='Latitude'
                    variant='outlined'
                    fullWidth
                    required
                    error={(lat.length === 0 && IsSubmitted) || isNaN(Number(lat))}
                    helperText={!(lat.length) && (IsSubmitted) ? 'Latitude is required' : isNaN(Number(lat)) ? 'Please enter a valid number' : ''}
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder='e.g., 36.9741'
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      },
                    }}
                  />
                  <TextField
                    label='Longitude'
                    variant='outlined'
                    fullWidth
                    required
                    error={(long.length === 0 && IsSubmitted) || isNaN(Number(long))}
                    helperText={!(long.length) && (IsSubmitted) ? 'Longitude is required' : isNaN(Number(long)) ? 'Please enter a valid number' : ''}
                    value={long}
                    onChange={(e) => setLong(e.target.value)}
                    placeholder='e.g., -122.0308'
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      },
                    }}
                  />

                  <TagSelector selectedTags={selectedTags} onTagsChange={setSelectedTags} axiosPrivate={axiosPrivate} />

                  <MetadataEditor rows={metadataRows} rowErrors={metadataErrors} onRowsChange={setMetadataRows} />
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
                  {/* get location buttion */}

                  <Button
                    variant='outlined'
                    onClick={getLocation}
                    sx={{
                      borderColor: '#ddd',
                      color: '#666',
                      '&:hover': {
                        borderColor: '#bbb',
                        backgroundColor: '#f5f5f5',
                      },
                    }}
                  >
                    Find Me
                  </Button>

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
                    onClick={async () => {
                      setIsSubmitted(true);
                      if (hasMetadataError) {
                        return;
                      }
                      try {
                        const res = await addCell(name, location, long, lat, archive, user.email, metadata);

                        // Assign tags to the newly created cell if any tags are selected
                        if (selectedTags.length > 0 && res.id) {
                          const tagIds = selectedTags.map((tag) => tag.id);
                          await assignCellTagsMutation.mutateAsync({ cellId: res.id, tagIds });
                        }

                        setResponse(res);
                        refetch();
                      } catch (err) {
                        setError(err);
                        console.error(err);
                      }
                    }}
                    disabled={
                      !name.trim() ||
                      !location.trim() ||
                      !lat.trim() ||
                      !long.trim() ||
                      isNaN(Number(lat)) ||
                      isNaN(Number(long)) ||
                      hasMetadataError
                    }
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
                    Add Cell
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
                  Error Creating Cell
                </Typography>
              </Box>

              {/* Error Content */}
              <Box sx={{ padding: '2rem' }}>
                <Typography variant='body1' sx={{ mb: 3, color: '#666', lineHeight: 1.6 }}>
                  Duplicate cell names are not allowed. Please try again with a different name.
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
                    Cell Created Successfully!
                  </Typography>
                  <Typography
                    variant='body2'
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      mt: 0.5,
                    }}
                  >
                    Your environmental monitoring cell is ready
                  </Typography>
                </Box>

                {/* Success Content */}
                <Box sx={{ padding: '2rem' }}>
                  {/* Cell Details */}
                  <Box
                    sx={{
                      backgroundColor: '#f8f9fa',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      mb: '1.5rem',
                    }}
                  >
                    <Typography variant='h6' sx={{ mb: 2, color: '#2e7d32', fontWeight: 600 }}>
                      Cell: {response.name}
                    </Typography>

                    {/* API Endpoints Section */}
                    <Typography variant='h6' sx={{ mb: 2, color: '#333', fontSize: '1.1rem' }}>
                      API Endpoints
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Power Data Endpoint */}
                      <Box>
                        <Chip label='Power Data' color='primary' variant='outlined' size='small' sx={{ mb: 1 }} />
                        <Typography variant='body2' sx={{ mb: 1, color: '#666' }}>
                          Endpoint for uploading power data:
                        </Typography>
                        <Typography
                          variant='body2'
                          sx={{
                            fontFamily: 'monospace',
                            backgroundColor: '#e8f5e8',
                            color: '#2e7d32',
                            p: 1,
                            borderRadius: '4px',
                            wordBreak: 'break-all',
                            userSelect: 'all',
                            fontSize: '0.75rem',
                          }}
                        >
                          https://dirtviz.jlab.ucsc.edu/api/sensor/{response.id}
                        </Typography>
                      </Box>

                      {/* TEROS Data Endpoint */}
                      <Box>
                        <Chip label='TEROS Data' color='secondary' variant='outlined' size='small' sx={{ mb: 1 }} />
                        <Typography variant='body2' sx={{ mb: 1, color: '#666' }}>
                          Endpoint for uploading TEROS data:
                        </Typography>
                        <Typography
                          variant='body2'
                          sx={{
                            fontFamily: 'monospace',
                            backgroundColor: '#e8f5e8',
                            color: '#2e7d32',
                            p: 1,
                            borderRadius: '4px',
                            wordBreak: 'break-all',
                            userSelect: 'all',
                            fontSize: '0.75rem',
                          }}
                        >
                          https://dirtviz.jlab.ucsc.edu/api/sensor/{response.id}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Button
                    variant='contained'
                    onClick={() => {
                      DoneButtonClose(); 
                      setIsSubmitted(false);}
                    }
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

export default AddCellModal;
