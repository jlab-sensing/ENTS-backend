import './DragItem.css'
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';

export const DragItem = ({keys, id, title, columnId}) => {

  const {attributes, listeners, setNodeRef, 
  transform, transition}= useSortable({id})
  const key = keys; 
  const columnID = columnId;
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
