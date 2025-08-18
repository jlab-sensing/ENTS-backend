import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, IconButton, Modal, Typography } from '@mui/material';
import { React, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { deleteLogger } from '../../../services/logger';
import PropTypes from 'prop-types';

function DeleteLoggerModal({ id }) {
  let data = useOutletContext();
  const refetch = data[9]; // Logger refetch function from outlet context
  const user = data[4];
  
  const [isOpen, setOpen] = useState(false);
  const [response, setResponse] = useState(null);
  const [loggerId, setLoggerId] = useState('');

  const handleOpen = () => {
    if (id != '') {
      setOpen(true);
      setLoggerId(id);
    }
    setResponse(null);
  };

  const handleClose = () => {
    setOpen(false);
    setResponse(null);
    setLoggerId('');
  };

  useEffect(() => {
    console.log(response);
  }, [response]);

  if (!user) {
    return <></>;
  }

  return (
    <>
      <Button sx={{ color: 'black' }} key='delete' onClick={handleOpen}>
        <DeleteIcon />
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
          {!response ? (
            <>
              <IconButton
                sx={{ position: 'absolute', top: 5, right: 5 }}
                aria-label='close'
                size='small'
                onClick={handleClose}
              >
                <CloseIcon fontSize='small' />
              </IconButton>
              <Typography variant='h6' component='h2' sx={{ mb: 3 }}>
                Delete Logger
              </Typography>
              <Typography sx={{ mb: 3 }}>
                Are you sure you want to delete this logger? This action cannot be undone.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={handleClose} color='secondary'>
                  Cancel
                </Button>
                <Button
                  variant='contained'
                  color='error'
                  onClick={() => {
                    deleteLogger(loggerId)
                      .then((res) => {
                        setResponse(res);
                        refetch();
                      })
                      .catch((error) => {
                        console.error('Delete failed:', error);
                        setResponse({ error: true, message: 'Failed to delete logger' });
                      });
                  }}
                >
                  Delete Logger
                </Button>
              </Box>
            </>
          ) : (
            <>
              {response.error ? (
                <>
                  <Typography variant='h6' sx={{ color: 'error.main', mb: 2 }}>
                    Error Deleting Logger
                  </Typography>
                  <Typography sx={{ mb: 3 }}>
                    {response.message || 'An error occurred while deleting the logger.'}
                  </Typography>
                  <Button onClick={handleClose} variant='contained' color='primary' fullWidth>
                    Done
                  </Button>
                </>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <CheckCircleIcon sx={{ color: 'success.main', fontSize: 28 }} />
                    <Typography variant='h5' component='h2' sx={{ color: 'success.main', fontWeight: 'bold' }}>
                      Logger Deleted Successfully!
                    </Typography>
                  </Box>
                  <Button
                    variant='contained'
                    color='success'
                    onClick={handleClose}
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
            </>
          )}
        </Box>
      </Modal>
    </>
  );
}

DeleteLoggerModal.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default DeleteLoggerModal;