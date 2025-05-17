import {
  DndContext,
  DragOverlay,
  MouseSensor,
  closestCorners,
  defaultDropAnimation,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Box, Button, Fade, Modal, Stack, Tooltip, Typography } from '@mui/material';
import { PropTypes } from 'prop-types';
import { React, useState } from 'react';
import archive from '../../../assets/archive.svg';
import { useSetCellArchive } from '../../../services/cell';
import { DragItem } from './DragItem/DragItem';
import { DropList } from './DropList/DropList';

export default function ArchiveModal({ cells }) {
  const [cellsList, setCellsList] = useState(
    cells.data.map((cell) => ({
      key: cell.id,
      id: cell.id,
      title: cell.name,
      isArchived: cell.archive,
    })),
  );
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [activeCell, setActiveCell] = useState(null);
  const { mutate: setCellArchive } = useSetCellArchive();
  const [draggedItem, setDraggedItem] = useState(null);

  // Configure sensors with better activation constraints
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 0,
      delay: 0,
      tolerance: 0,
    },
  });

  const sensors = useSensors(mouseSensor);

  // Position modifiers to adjust drag overlay position
  const modifiers = [];

  // Configure drop animation
  const dropAnimation = {
    ...defaultDropAnimation,
    dragSourceOpacity: 0.5,
    duration: 200,
    easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
  };

  const handleDragOver = (event) => {
    // activeID - selected dragItem id
    // overID - id of column or dragItem that selected dragItem is over
    const { active, over } = event;
    if (!over) return;

    const overID = over.id;
    const activeID = active.id;
    if (overID === activeID) return;

    const isActiveATask = active.id != 'unarchive' && active.id != 'archive';
    const isOverATask = over.id != 'unarchive' && over.id != 'archive';

    if (!isActiveATask) return;
    /// Both active and over are tasks

    const overIndex = cellsList.findIndex((task) => task.id === overID);
    const activeIndex = cellsList.findIndex((task) => task.id === activeID);

    if (isOverATask) {
      setCellsList((cellsList) => {
        ///If the tasks are in different columns
        if (cellsList[activeIndex].isArchived !== cellsList[overIndex].isArchived) {
          cellsList[activeIndex].isArchived = cellsList[overIndex].isArchived;
          return arrayMove(cellsList, activeIndex, overIndex);
        } else {
          ///If the tasks are in the same column
          return arrayMove(cellsList, activeIndex, overIndex);
        }
      });
    }
    /// If the active is a task and the over is a column
    else if (cellsList[activeIndex].isArchived != (overID === 'archive')) {
      setCellsList((cellsList) => {
        cellsList[activeIndex].isArchived = !cellsList[activeIndex].isArchived;
        return arrayMove(cellsList, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = (event) => {
    const { over } = event;
    /// Over a column
    if (over.id === 'unarchive' || over.id === 'archive') {
      setCellArchive({ cellId: activeCell.id, archive: over.id === 'archive' });
      return;
    }
    /// Over a cell
    else if (activeCell.data.current.columnID !== over.data.current.columnID) {
      setCellArchive({ cellId: activeCell.id, archive: !(activeCell.data.current.columnID === 'archive') });
      return;
    }
    /// Not changed
    return;
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveCell(active);
    const draggedCell = cellsList.find((cell) => cell.id === active.id);
    setDraggedItem(draggedCell);
  };

  return (
    <>
      <Tooltip title='Archive' placement='bottom' disableInteractive>
        <Button
          variant='outlined'
          onClick={handleOpen}
          sx={{
            minWidth: '40px',
            width: '40px',
            height: '40px',
            padding: '8px',
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          <Box
            component='img'
            src={archive}
            sx={{
              width: '20px',
              height: '20px',
              opacity: 0.8,
            }}
          />
        </Button>
      </Tooltip>
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Fade in={open}>
          <Box
            sx={{
              width: '80%',
              maxWidth: '1000px',
              maxHeight: '80vh',
              bgcolor: 'background.paper',
              borderRadius: '16px',
              boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
              p: 4,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Typography
              variant='h5'
              component='h2'
              sx={{
                mb: 1,
                textAlign: 'center',
                fontWeight: 500,
                color: 'text.primary',
              }}
            >
              Manage Archives
            </Typography>
            <Typography
              variant='body2'
              sx={{
                mb: 3,
                textAlign: 'center',
                color: 'text.secondary',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
              }}
            >
              <DragIndicatorIcon fontSize='small' /> Drag and drop items to move them between sections
            </Typography>
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              collisionDetection={closestCorners}
            >
              <Stack
                direction='row'
                spacing={4}
                justifyContent='space-between'
                sx={{
                  height: 'calc(80vh - 180px)',
                  overflow: 'hidden',
                }}
              >
                <DropList
                  id='unarchive'
                  dragItems={cellsList.filter((item) => item.isArchived === false)}
                  columnID='unarchive'
                />
                <DropList
                  id='archive'
                  dragItems={cellsList.filter((item) => item.isArchived === true)}
                  columnID='archive'
                />
              </Stack>
              <DragOverlay dropAnimation={dropAnimation} modifiers={modifiers} zIndex={1000}>
                {draggedItem ? (
                  <DragItem
                    id={draggedItem.id}
                    title={draggedItem.title}
                    columnID={draggedItem.isArchived ? 'archive' : 'unarchive'}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </Box>
        </Fade>
      </Modal>
    </>
  );
}

ArchiveModal.propTypes = {
  cells: PropTypes.shape({
    data: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
};
