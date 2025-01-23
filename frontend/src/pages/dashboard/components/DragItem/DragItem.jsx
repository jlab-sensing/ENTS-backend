import './DragItem.css';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PropTypes from 'prop-types';

export const DragItem = ({ id, title, columnID }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
    data: {
      columnID: columnID,
    },
  });
  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={style} className='DragItem'>
      {title}
    </div>
  );
};

DragItem.propTypes = {
  id: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  columnID: PropTypes.string.isRequired,
};
