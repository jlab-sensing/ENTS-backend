import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';
import useAuth from '../../../auth/hooks/useAuth';
import LoginPromptModal from '../../../components/LoginPromptModal';

const StreamToggle = ({ isStreaming, onToggle }) => {
  const { loggedIn } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleChange = (_event, value) => {
    if (value === null) return;
    
    // If trying to enable streaming and user is not logged in, show login modal
    if (value === 'stream' && loggedIn === false) {
      setShowLoginModal(true);
      return;
    }
    
    onToggle(value === 'stream');
  };

  // Handle click on disabled live button to show login modal
  const handleLiveButtonClick = (event) => {
    if (loggedIn === false) {
      event.preventDefault();
      event.stopPropagation();
      setShowLoginModal(true);
    }
  };

  return (
    <>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={isStreaming ? 'stream' : 'hourly'}
        onChange={handleChange}
        aria-label="mode toggle"
        sx={{
          borderRadius: 9999,
          backgroundColor: '#fff',
          border: '1px solid',
          borderColor: 'success.#112E51',
          position: 'relative',
          overflow: 'hidden',
          '& .MuiToggleButtonGroup-grouped': {
            m: 0,
            border: 0,
            borderRadius: 9999,
            px: 2,
            py: 1.2,
            textTransform: 'none',
            fontWeight: 600,
            color: 'text.secondary',
            minWidth: 73,
            width: '50%',
            position: 'relative',
            zIndex: 2,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          },
          '& .Mui-selected': {
            backgroundColor: 'transparent !important',
            color: '#000 !important',
            fontWeight: 700,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: isStreaming ? '50%' : '0%',
            width: '50%',
            height: '100%',
            backgroundColor: 'rgb(255 214 11 / 50%)',
            borderRadius: 9999,
            transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1,
          },
        }}
      >
        <ToggleButton value="hourly">Hourly</ToggleButton>
        <ToggleButton 
          value="stream"
          onClick={handleLiveButtonClick}
          sx={{
            ...(loggedIn === false && {
              color: 'rgba(0, 0, 0, 0.38) !important',
              cursor: 'pointer !important',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }),
          }}
        >
          Live
        </ToggleButton>
      </ToggleButtonGroup>
      
      <LoginPromptModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
};

StreamToggle.propTypes = {
  isStreaming: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

export default StreamToggle;
