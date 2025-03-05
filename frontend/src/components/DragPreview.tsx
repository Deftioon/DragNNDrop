import { FC } from "react";
import { useDragLayer } from "react-dnd";
import { ComponentData } from "../App";

interface DragPreviewProps {
  components: ComponentData[];
}

const DragPreview: FC<DragPreviewProps> = ({ components }) => {
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging || !currentOffset) {
    return null;
  }

  // Find the component being dragged
  const draggedComponent = item?.id
    ? components.find((c) => c.id === item.id)
    : undefined;

  if (!draggedComponent) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        pointerEvents: "none",
        zIndex: 100,
        left: 0,
        top: 0,
        transform: `translate(${currentOffset.x}px, ${currentOffset.y}px)`,
      }}
    >
      <div className="component-preview">
        <div className="component-card preview">
          <h3>{draggedComponent.name}</h3>
        </div>
      </div>
    </div>
  );
};

export default DragPreview;
