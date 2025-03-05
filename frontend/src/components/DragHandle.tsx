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
  
  // Debug logging function
  const logDebug = (message: string, data?: any) => {
    if (data) {
      console.log(`[DragHandle ${instanceId}] ${message}`, data);
    } else {
      console.log(`[DragHandle ${instanceId}] ${message}`);
    }
  };
  
  // Get parent component (for position calculation)
  const getParentComponent = () => {
    if (!handleRef.current) return null;
    
    // First go up to component-wrapper, then to dropped-component
    const componentWrapper = handleRef.current.parentElement;
    if (!componentWrapper) {
      logDebug('No component wrapper parent found');
      return null;
    }
    
    const droppedComponent = componentWrapper.parentElement;
    if (!droppedComponent) {
      logDebug('No dropped component parent found');
      return null;
    }
    
    logDebug('Found parent component', droppedComponent);
    return droppedComponent;
  };

  // Add ref to find canvas scale
  const getCanvasScale = () => {
    // Look for the canvas element with transform
    const canvas = document.querySelector(".canvas") as HTMLElement;
    if (!canvas) return 1;
    
    // Extract scale from transform matrix
    const transform = window.getComputedStyle(canvas).transform;
    if (transform === 'none') return 1;
    
    // Parse the transform matrix values
    const matrix = transform.match(/^matrix\((.+)\)$/);
    if (matrix) {
      const values = matrix[1].split(', ');
      // The scale is in position 0
      return parseFloat(values[0]);
    }
    
    return 1;
  };

  // Handle mouse down to start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    logDebug('Mouse down event received', { x: e.clientX, y: e.clientY });
    
    const parentComponent = getParentComponent();
    if (!parentComponent) {
      logDebug('Could not find parent component');
      return;
    }
    
    // No need to get scale if not using it
    // const scale = getCanvasScale();
    
    if (parentComponent) {
      setIsDragging(true);
      
      // Store initial positions, accounting for scale
      dragStartPosRef.current = { x: e.clientX, y: e.clientY };
      
      // Get current component position
      const currentLeft = parseInt(parentComponent.style.left || '0', 10);
      const currentTop = parseInt(parentComponent.style.top || '0', 10);
      componentInitialPosRef.current = { x: currentLeft, y: currentTop };
      
      // Add global mouse event listeners
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  // Handle mouse move during drag
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragStartPosRef.current || !componentInitialPosRef.current) return;
    
    // Prevent default to avoid text selection
    e.preventDefault();
    
    const parentComponent = getParentComponent();
    if (!parentComponent) return;
    
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
    
    if (e.buttons !== 1) {
      // Mouse button released outside of window
      handleMouseUp(e);
    }
  };

  // Handle mouse up to end dragging
  const handleMouseUp = (e: MouseEvent) => {
    if (isDragging && componentInitialPosRef.current && dragStartPosRef.current) {
      logDebug('Mouse up - ending drag');
      
      const scale = getCanvasScale();
      
      // Calculate delta with scale adjustment
      const dx = (e.clientX - dragStartPosRef.current.x) / scale;
      const dy = (e.clientY - dragStartPosRef.current.y) / scale;
      
      // Calculate final position
      const finalX = componentInitialPosRef.current.x + dx;
      const finalY = componentInitialPosRef.current.y + dy;
      
      logDebug('Final position', { x: finalX, y: finalY });
      
      // Update component position through props
      onMoveComponent(instanceId, { x: finalX, y: finalY });
    }
    
    // Clean up
    setIsDragging(false);
    dragStartPosRef.current = null;
    componentInitialPosRef.current = null;
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  // Clean up event listeners if component unmounts while dragging
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div 
      ref={handleRef}
      className="drag-handle" 
      style={{ 
        opacity: isDragging ? 0.5 : 1, 
        cursor: isDragging ? 'grabbing' : 'grab', 
        touchAction: 'none',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
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
