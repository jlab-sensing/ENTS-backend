import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Fade,
  IconButton,
  Modal,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import useAxiosPrivate from '../../../auth/hooks/useAxiosPrivate';

function AccountInfo() {
  const axiosPrivate = useAxiosPrivate();
  const contextData = useOutletContext();
  const user = contextData?.[4]; // Keeping the same context access pattern as original
  const setUser = contextData?.[5]; // Get the setUser function from context

  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState(null);

  if (!user) {
    return <></>;
  }

  /**
   * Handles opening the edit form and initializes form data
   */
  const handleEdit = () => {
    setIsEditing(true);
    // Set form data with current values to avoid race condition
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
    });
    setError(null);
  };

  /**
   * Validates form input before submission
   * @returns {boolean} True if valid, false otherwise
   */
  const validateForm = () => {
    if (!formData.first_name || formData.first_name.trim() === '') {
      setError('First name cannot be empty');
      return false;
    }
    if (!formData.last_name || formData.last_name.trim() === '') {
      setError('Last name cannot be empty');
      return false;
    }
    return true;
  };

  /**
   * Handles saving updated user information
   */
  const handleSave = async () => {
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axiosPrivate.put('/user', formData);
      if (response.status === 200 && response.data) {
        // Update the user data in parent context
        if (setUser) {
          setUser({
            ...user,
            first_name: response.data.first_name,
            last_name: response.data.last_name,
          });
        }
        setIsEditing(false);
        setError(null);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000); // Hide after 3 seconds
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles canceling the edit operation
   */
  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '650px',
        margin: '0 auto',
        ml: { xs: 3, sm: 4, md: 6 }, // Better spacing from sidebar
        mr: 3,
        p: 3,
        position: 'relative',
      }}
    >
      {/* Fixed position notification to avoid overlap */}
      <Fade in={showSuccess} timeout={700}>
        <Alert
          severity='success'
          sx={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1300,
            borderRadius: '12px',
            minWidth: '300px',
            maxWidth: '500px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          }}
        >
          Profile updated successfully!
        </Alert>
      </Fade>

      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        mt: 1 // Add some top margin for better spacing
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AccountCircleIcon sx={{ fontSize: '2.5rem', color: '#588157' }} />
          <Typography 
            variant='h4' 
            sx={{ 
              color: '#588157', 
              fontWeight: 'bold',
              fontSize: '1.75rem'
            }}
          >
            Account Information
          </Typography>
        </Box>
        <Button
          variant='contained'
          onClick={handleEdit}
          sx={{
            backgroundColor: '#588157',
            '&:hover': {
              backgroundColor: '#3a5a40',
            },
            borderRadius: '8px',
            px: 3,
            py: 1,
            fontSize: '1rem',
            fontWeight: 500,
          }}
        >
          Edit Profile
        </Button>
      </Box>

      {/* Profile Cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Email Card */}
        <Card 
          sx={{
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e9ecef',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EmailIcon sx={{ fontSize: '1.5rem', color: '#588157' }} />
              <Box>
                <Typography 
                  variant='body2' 
                  sx={{ 
                    color: '#666', 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 0.5
                  }}
                >
                  Email Address
                </Typography>
                <Typography 
                  variant='h6' 
                  sx={{ 
                    color: '#333',
                    fontWeight: 500,
                    fontSize: '1.1rem'
                  }}
                >
                  {user.email}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Name Card */}
        <Card 
          sx={{
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e9ecef',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PersonIcon sx={{ fontSize: '1.5rem', color: '#588157' }} />
              <Box>
                <Typography 
                  variant='body2' 
                  sx={{ 
                    color: '#666', 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    mb: 0.5
                  }}
                >
                  Full Name
                </Typography>
                <Typography 
                  variant='h6' 
                  sx={{ 
                    color: '#333',
                    fontWeight: 500,
                    fontSize: '1.1rem'
                  }}
                >
                  {user.first_name} {user.last_name}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Modal
        open={isEditing}
        onClose={handleCancel}
        aria-labelledby='edit-profile-modal-title'
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
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
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
              onClick={handleCancel}
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
              Edit Profile
            </Typography>
            <Typography 
              variant='body2' 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                mt: 0.5
              }}
            >
              Update your account information
            </Typography>
          </Box>

          {/* Form Section */}
          <Box sx={{ padding: '2rem' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <TextField
                fullWidth
                label='First Name'
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                error={error && error.includes('First name')}
                helperText={error && error.includes('First name') ? error : ''}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  }
                }}
              />
              <TextField
                fullWidth
                label='Last Name'
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                error={error && error.includes('Last name')}
                helperText={error && error.includes('Last name') ? error : ''}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  }
                }}
              />
              {error && !error.includes('First name') && !error.includes('Last name') && (
                <Typography color='error' sx={{ fontSize: '0.875rem' }}>
                  {error}
                </Typography>
              )}
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
                onClick={handleCancel}
                disabled={isSubmitting}
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
                type='submit'
                variant='contained'
                disabled={isSubmitting || !formData.first_name?.trim() || !formData.last_name?.trim()}
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}

export default AccountInfo;
