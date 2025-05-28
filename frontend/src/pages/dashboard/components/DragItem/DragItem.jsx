import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';

export const DragItem = ({ id, title, columnID, isOverlay = false }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: {
      columnID: columnID,
    },
  });

  const style = {
    transition,
    opacity: isDragging ? 0.4 : 1,
    touchAction: 'none',
  };

  // Only apply transform if it exists to prevent unwanted offsets
  if (transform) {
    style.transform = CSS.Transform.toString(transform);
  }

  if (isOverlay) {
    style.cursor = 'grabbing';
    style.boxShadow = '0px 8px 16px rgba(0, 0, 0, 0.15)';
    style.position = 'fixed';
    style.width = '100%';
    style.zIndex = 999;
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 2,
        mb: 1,
        bgcolor: 'background.paper',
        borderRadius: '8px',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: isDragging
          ? 'none'
          : isOverlay
          ? '0px 8px 16px rgba(0, 0, 0, 0.15)'
          : '0px 1px 3px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s ease',
        cursor: isDragging ? 'grabbing' : 'grab',
        '&:hover': {
          bgcolor: 'action.hover',
          borderColor: 'primary.main',
        },
      }}
      {...attributes}
      {...listeners}
    >
      <DragIndicatorIcon
        sx={{
          color: 'text.secondary',
          opacity: 0.5,
          cursor: 'grab',
        }}
      />
      <Typography
        sx={{
          color: 'text.primary',
          fontWeight: 400,
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};

DragItem.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  title: PropTypes.string.isRequired,
  columnID: PropTypes.string.isRequired,
  isOverlay: PropTypes.bool,
};

DragItem.defaultProps = {
  isOverlay: false,
};
