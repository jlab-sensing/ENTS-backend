import './DragItem.css'
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import PropTypes from 'prop-types'

export const DragItem = ({keys, id, title, columnId}) => {

  const {attributes, listeners, setNodeRef, 
  transform, transition}= useSortable({id})
  const key = keys; // eslint-disable-line no-unused-vars
  const columnID = columnId; // eslint-disable-line no-unused-vars
  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div  ref={setNodeRef}
    {...attributes}
    {...listeners}
    style={style}
    className = 'DragItem'
    > 
     {title}
    </div>
  );
};

DragItem.propTypes = {
  keys: PropTypes.any.isRequired,
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  columnId: PropTypes.string.isRequired,
};