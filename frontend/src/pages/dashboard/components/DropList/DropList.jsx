import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import { Box, Typography, TextField } from '@mui/material';
import PropTypes from 'prop-types';
import { React, useState } from 'react';
import { DragItem } from '../DragItem/DragItem';

export const DropList = ({ id, dragItems, columnID }) => {
  const { setNodeRef } = useDroppable({ id });
  const name = columnID === 'archive' ? 'Archive' : 'Active Cells';
  const [filter, setFilter] = useState('');

  if (!Array.isArray(dragItems)) {
    console.error('CellDrags prop is not an array', dragItems);
  }

  const filteredItems = dragItems.filter(cell => cell.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <Box
      ref={setNodeRef}
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
        }}
      >
        {columnID === 'archive' ? (
          <ArchiveIcon sx={{ color: 'text.secondary' }} />
        ) : (
          <UnarchiveIcon sx={{ color: 'text.secondary' }} />
        )}
        <Typography
          variant='h6'
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
          }}
        >
          {name}
        </Typography>
      </Box>
      <TextField
        fullWidth="true"
        label="Search cells"
        variant="outlined"
        size="small"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        sx={{ 
          mb: 2,
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'divider',
              borderWidth: '1px',
              borderRadius: '8px',
              boxShadow: '0px 2px 8px hsla(0, 0%, 0%, 0.05)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }
          }
        }}
      />
      <Box
        sx={{
          width: '100%',
          height: '100%',
          bgcolor: 'background.default',
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0px 2px 8px hsla(0, 0%, 0%, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            p: 2,
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: (theme) => theme.palette.divider,
              borderRadius: '3px',
            },
            scrollBehavior: 'smooth',
            '& > *:not(:last-child)': {
              marginBottom: '8px',
            },
          }}
        >
          <SortableContext items={filteredItems} strategy={verticalListSortingStrategy}>
            {filteredItems.map((item) => (
              <DragItem key={item.id} id={item.id} title={item.title} columnID={columnID} />
            ))}
          </SortableContext>
        </Box>
      </Box>
    </Box>
  );
};

DropList.propTypes = {
  id: PropTypes.string.isRequired,
  dragItems: PropTypes.array.isRequired,
  columnID: PropTypes.string.isRequired,
};
