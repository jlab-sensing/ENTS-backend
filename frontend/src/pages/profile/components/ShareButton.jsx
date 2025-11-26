import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Send';
import { Box, Button, IconButton, TextField, Typography } from '@mui/material';
import { React, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Popover from '@mui/material/Popover';
import { shareCell } from '../../../services/cell';
import PropTypes from 'prop-types';
import useAuth from '../../../auth/hooks/useAuth';

function ShareButton({ ids }) {
  let data = useOutletContext();
  const refetch = data[3];
  const user = data[4];
  data = data[0];
  const { auth } = useAuth();
  const [response, setResponse] = useState(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClose = () => {
    setAnchorEl(null);
    setResponse(null);
    setEmail('');
    setError('');
  };

  const open = Boolean(anchorEl);
  const handleOpen = (event) => {
    if (ids && ids.length > 0) {
      setAnchorEl(event.currentTarget);
      setError('');
      setResponse(null);
    }
  };
  const id = open ? 'simple-popover' : undefined;

  const handleShare = () => {
    // Validate email
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    // Share all selected cells
    const sharePromises = ids.map((cellId) =>
      shareCell(cellId, email, auth?.accessToken)
        .then((res) => res)
        .catch((error) => {
          console.error(`Error sharing cell ${cellId}:`, error);
          throw error;
        })
    );

    Promise.all(sharePromises)
      .then(() => {
        setResponse({ success: true });
        setError('');
        refetch();
      })
      .catch((error) => {
        setError(error.response?.data?.message || 'Failed to share cells. Please try again.');
      });
  };

  if (!user) {
    return <></>;
  }

  return (
    <>
      <Button sx={{ color: 'black' }} key='share' onClick={handleOpen} disabled={!ids || ids.length === 0}>
        <ShareIcon fontSize='large' />
      </Button>
      <Popover
        id={id}
        open={open}
        onClose={handleClose}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <Box
          sx={{
            width: 450,
            bgcolor: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: 'none',
            overflow: 'hidden',
          }}
          component='form'
          onSubmit={(e) => {
            e.preventDefault();
            handleShare();
          }}
        >
          {response == null && (
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
                  Share Cell{ids && ids.length > 1 ? 's' : ''}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    mt: 0.5,
                  }}
                >
                  Share {ids && ids.length} cell{ids && ids.length > 1 ? 's' : ''} with another user
                </Typography>
              </Box>

              {/* Content Section */}
              <Box sx={{ padding: '2rem' }}>
                <Typography variant='body1' sx={{ mb: 2, color: '#666', lineHeight: 1.6 }}>
                  Enter the email address of the user you want to share with:
                </Typography>

                <TextField
                  fullWidth
                  label='Email Address'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!error}
                  helperText={error}
                  sx={{ mb: 3 }}
                />

                {/* Selected Cells */}
                <Box
                  sx={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    padding: '1rem',
                    mb: 3,
                  }}
                >
                  <Typography variant='body2' sx={{ color: '#666', fontWeight: 500 }}>
                    Selected Cell IDs:
                  </Typography>
                  <Typography variant='body2' sx={{ color: '#333', mt: 0.5 }}>
                    {ids && ids.join(', ')}
                  </Typography>
                </Box>

                {/* Action Buttons */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: 'flex-end',
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
                    onClick={handleShare}
                    sx={{
                      backgroundColor: '#588157',
                      '&:hover': { backgroundColor: '#3a5a40' },
                      borderRadius: '8px',
                      px: '1.5rem',
                    }}
                  >
                    Share Cell{ids && ids.length > 1 ? 's' : ''}
                  </Button>
                </Box>
              </Box>
            </>
          )}
          {response && (
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
                  Cell{ids && ids.length > 1 ? 's' : ''} Shared Successfully!
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    mt: 0.5,
                  }}
                >
                  The cell{ids && ids.length > 1 ? 's have' : ' has'} been shared with {email}
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
                  <Typography variant='body1' sx={{ color: '#666', lineHeight: 1.6 }}>
                    Cell{ids && ids.length > 1 ? 's' : ''} <strong>{ids && ids.join(', ')}</strong>{' '}
                    {ids && ids.length > 1 ? 'have' : 'has'} been successfully shared with <strong>{email}</strong>.
                  </Typography>
                </Box>

                <Button
                  variant='contained'
                  onClick={handleClose}
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
          )}
        </Box>
      </Popover>
    </>
  );
}

export default ShareButton;

ShareButton.propTypes = {
  ids: PropTypes.arrayOf(PropTypes.number).isRequired,
};
