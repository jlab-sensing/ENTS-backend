import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import React from 'react';
import { DragItem } from '../DragItem/DragItem';

export const DropList = ({ id, dragItems, columnID }) => {
  const { setNodeRef } = useDroppable({ id });
  const name = columnID === 'archive' ? 'Archive' : 'Active Cells';

  if (!Array.isArray(dragItems)) {
    console.error('CellDrags prop is not an array', dragItems);
  }

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
      <Box
        sx={{
          width: '100%',
          height: '100%',
          bgcolor: 'background.default',
          borderRadius: '12px',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
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
          <SortableContext items={dragItems} strategy={verticalListSortingStrategy}>
            {dragItems.map((dragItem) => (
              <DragItem key={dragItem.id} id={dragItem.id} title={dragItem.title} columnID={columnID} />
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
