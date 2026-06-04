import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box, IconButton, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { useCallback, useRef, useState } from 'react';

const baseHandleSx = {
  position: 'absolute',
  top: 8,
  left: 8,
  zIndex: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 26,
  height: 26,
  p: 0,
  border: '1px solid transparent',
  borderRadius: '6px',
  bgcolor: (theme) => alpha(theme.palette.text.primary, 0.06),
  color: 'text.secondary',
  cursor: 'grab',
  transition: 'opacity 0.18s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
  '&:hover': {
    bgcolor: (theme) => alpha(theme.palette.text.primary, 0.1),
    borderColor: 'divider',
    color: 'text.primary',
    boxShadow: (theme) => `0 1px 3px ${alpha(theme.palette.common.black, 0.12)}`,
  },
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: 2,
  },
  '&:active': {
    cursor: 'grabbing',
  },
};

/**
 * Minimal sortable wrapper: hover-revealed ≡ handle top-left (Grafana/Linear-style).
 */
function SortableChartPanelInner({ id, children, onRemove, panelColumns }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const [hovered, setHovered] = useState(false);
  const [handleFocused, setHandleFocused] = useState(false);
  const handleRef = useRef(null);

  const showHandle = hovered || handleFocused || isDragging;

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback((event) => {
    setHovered(false);
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setHandleFocused(false);
      handleRef.current?.blur();
    }
  }, []);

  const style = {
    transition,
    opacity: isDragging ? 0.92 : 1,
  };

  if (transform) {
    style.transform = CSS.Transform.toString(transform);
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: 'relative',
        width: '100%',
        minWidth: 0,
        height:
          panelColumns === 1
            ? { xs: '320px', md: '360px' }
            : { xs: '400px', md: '450px' },
        p: 3,
        boxSizing: 'border-box',
      }}
    >
      <Tooltip title="Drag to reorder" placement="right" enterDelay={400} disableInteractive>
        <Box
          ref={handleRef}
          component="button"
          type="button"
          className="panel-drag-handle"
          aria-label="Drag to reorder panel"
          tabIndex={showHandle ? 0 : -1}
          onFocus={() => setHandleFocused(true)}
          onBlur={() => setHandleFocused(false)}
          sx={{
            ...baseHandleSx,
            opacity: showHandle ? 1 : 0,
            pointerEvents: showHandle ? 'auto' : 'none',
            '@media (hover: none)': {
              opacity: showHandle ? 1 : 0.55,
              pointerEvents: 'auto',
            },
            ...(isDragging && {
              cursor: 'grabbing',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              borderColor: 'primary.light',
              color: 'primary.main',
            }),
          }}
          {...attributes}
          {...listeners}
        >
          <DragIndicatorIcon sx={{ fontSize: 16 }} />
        </Box>
      </Tooltip>

      {onRemove && (
        <Tooltip title="Remove panel" placement="left" enterDelay={400} disableInteractive>
          <IconButton
            type="button"
            className="panel-remove-btn"
            aria-label="Remove panel"
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(id);
            }}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 2,
              width: 26,
              height: 26,
              opacity: showHandle ? 1 : 0,
              pointerEvents: showHandle ? 'auto' : 'none',
              transition: 'opacity 0.18s ease',
              bgcolor: (theme) => alpha(theme.palette.text.primary, 0.06),
              '@media (hover: none)': {
                opacity: showHandle ? 1 : 0.55,
                pointerEvents: 'auto',
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      )}

      <Box
        sx={{
          width: '100%',
          height: '100%',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

SortableChartPanelInner.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  onRemove: PropTypes.func,
  panelColumns: PropTypes.oneOf([1, 2]),
};

export default function SortableChartPanel({ id, children, onRemove, panelColumns = 2 }) {
  if (children == null) {
    return null;
  }

  return (
    <SortableChartPanelInner id={id} onRemove={onRemove} panelColumns={panelColumns}>
      {children}
    </SortableChartPanelInner>
  );
}

SortableChartPanel.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node,
  onRemove: PropTypes.func,
  panelColumns: PropTypes.oneOf([1, 2]),
};
