import React, { useRef, useState, useEffect } from 'react';
import './DragHandle.css';

interface DragHandleProps {
  instanceId: string;
  onMoveComponent: (id: string, position: { x: number; y: number }) => void;
}

const DragHandle: React.FC<DragHandleProps> = ({ instanceId, onMoveComponent }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const componentInitialPosRef = useRef<{ x: number; y: number } | null>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  
  // Get parent component (for position calculation)
  const getParentComponent = () => {
    if (!handleRef.current) return null;
    
    // Get the closest parent with class "dropped-component"
    const droppedComponent = handleRef.current.closest('.dropped-component');
    return droppedComponent as HTMLElement;
  };

  // Add ref to find canvas scale
  const getCanvasScale = () => {
    const canvas = document.querySelector(".canvas") as HTMLElement;
    if (!canvas) return 1;
    
    const transform = window.getComputedStyle(canvas).transform;
    if (transform === 'none') return 1;
    
    const matrix = transform.match(/^matrix\((.+)\)$/);
    if (matrix) {
      const values = matrix[1].split(', ');
      return parseFloat(values[0]);
    }
    
    return 1;
  };

  // Handle pointer events for better cross-device support
  const handlePointerDown = (e: React.PointerEvent) => {
    // Capture the pointer to ensure we get all events even if pointer leaves the element
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    e.preventDefault();
    e.stopPropagation();
    
    const parentComponent = getParentComponent();
    if (!parentComponent) return;
    
    // Verify we're working with the correct component
    if (parentComponent.dataset.instanceId !== instanceId) {
      console.error(`DragHandle mismatch: Expected ${instanceId}, got ${parentComponent.dataset.instanceId}`);
      return;
    }
    
    setIsDragging(true);
    
    // Store initial positions
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    
    // Get current component position
    const currentLeft = parseInt(parentComponent.style.left || '0', 10);
    const currentTop = parseInt(parentComponent.style.top || '0', 10);
    componentInitialPosRef.current = { x: currentLeft, y: currentTop };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartPosRef.current || !componentInitialPosRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const parentComponent = getParentComponent();
    if (!parentComponent || parentComponent.dataset.instanceId !== instanceId) return;
    
    const scale = getCanvasScale();
    
    // Calculate position delta, accounting for canvas scale
    const dx = (e.clientX - dragStartPosRef.current.x) / scale;
    const dy = (e.clientY - dragStartPosRef.current.y) / scale;
    
    // Calculate new position
    const newX = componentInitialPosRef.current.x + dx;
    const newY = componentInitialPosRef.current.y + dy;
    
    // Update component position visually
    parentComponent.style.left = `${newX}px`;
    parentComponent.style.top = `${newY}px`;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.target instanceof HTMLElement) {
      e.target.releasePointerCapture(e.pointerId);
    }
    
    if (!isDragging || !dragStartPosRef.current || !componentInitialPosRef.current) return;
    
    const parentComponent = getParentComponent();
    if (!parentComponent || parentComponent.dataset.instanceId !== instanceId) return;
    
    const scale = getCanvasScale();
    
    // Calculate delta with scale adjustment
    const dx = (e.clientX - dragStartPosRef.current.x) / scale;
    const dy = (e.clientY - dragStartPosRef.current.y) / scale;
    
    // Calculate final position
    const finalX = componentInitialPosRef.current.x + dx;
    const finalY = componentInitialPosRef.current.y + dy;
    
    // Update component position through props
    onMoveComponent(instanceId, { x: finalX, y: finalY });
    
    // Clean up
    setIsDragging(false);
    dragStartPosRef.current = null;
    componentInitialPosRef.current = null;
  };

  // Add a fallback for pointer cancel/leave events
  const handlePointerCancel = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      dragStartPosRef.current = null;
      componentInitialPosRef.current = null;
    }
  };
  
  return (
    <div 
      ref={handleRef}
      className="drag-handle" 
      style={{ 
        opacity: isDragging ? 0.5 : 1, 
        cursor: isDragging ? 'grabbing' : 'grab', 
        touchAction: 'none', // Important for pointer events
        userSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handlePointerCancel}
    >
      <div className="drag-handle-dots">
        <div className="drag-handle-dot"></div>
        <div className="drag-handle-dot"></div>
        <div className="drag-handle-dot"></div>
      </div>
    </div>
  );
};

export default DragHandle;
