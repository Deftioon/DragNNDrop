import { FC, useRef, useState, useEffect, useCallback } from "react";
import { useDrop } from "react-dnd";
import { DroppedComponent } from "../App";
import "./DropArea.css";
import DragHandle from "./DragHandle";
import GenericComponent from "./GenericComponent";

interface DropAreaProps {
  components: DroppedComponent[];
  onDrop: (componentId: string, position: { x: number; y: number }) => void;
  onMoveComponent: (id: string, position: { x: number; y: number }) => void;
  onComponentStateChange: (instanceId: string, fieldId: string, value: any) => void;
  onViewportChange?: (viewport: { scale: number; translateX: number; translateY: number }) => void;
}

interface DragItem {
  id: string;
  type: string;
  initialOffset: { x: number; y: number };
  currentOffset: { x: number; y: number };
}

interface ViewportState {
  scale: number;
  translateX: number;
  translateY: number;
  isDragging: boolean;
  startX: number;
  startY: number;
  initialScale?: number; // Added for pinch gestures
}

const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.5;

const DropArea: FC<DropAreaProps> = ({
  components,
  onDrop,
  onMoveComponent,
  onComponentStateChange,
  onViewportChange,
}) => {
  const dropRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // State for viewport transformations
  const [viewport, setViewport] = useState<ViewportState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    startX: 0,
    startY: 0
  });

  // React-DnD drop handling
  const [{ isOver }, drop] = useDrop<DragItem, unknown, { isOver: boolean }>(
    () => ({
      accept: "component",
      drop: (item, monitor) => {
        const clientOffset = monitor.getClientOffset();
        const initialClientOffset = monitor.getInitialClientOffset();
        const dropAreaElement = canvasRef.current;

        if (clientOffset && initialClientOffset && dropAreaElement) {
          const dropAreaRect = dropAreaElement.getBoundingClientRect();

          // Convert client coordinates to canvas coordinates, accounting for zoom level
          const x = (clientOffset.x - dropAreaRect.left - (item.initialOffset?.x || 0)) / viewport.scale;
          const y = (clientOffset.y - dropAreaRect.top - (item.initialOffset?.y || 0)) / viewport.scale;

          onDrop(item.id, { x, y });
        }
        return undefined;
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }),
  );

  drop(dropRef);

  // Handle wheel events for both pan and zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!canvasRef.current || !dropRef.current) return;
    
    e.preventDefault();
    
    const rect = dropRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check if Ctrl key is pressed for zooming
    if (e.ctrlKey || e.metaKey) {
      // ZOOMING: Ctrl+wheel or Cmd+wheel (for Mac)
      const zoomDirection = e.deltaY < 0 ? 1 : -1;
      const scaleFactor = zoomDirection * ZOOM_STEP;
      
      setViewport(prev => {
        // Calculate new scale with limits
        const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.scale + scaleFactor));
        
        // If scale didn't change, don't update
        if (newScale === prev.scale) return prev;
        
        // Calculate how the mouse point will move after scaling
        const mousePointX = (mouseX - prev.translateX) / prev.scale;
        const mousePointY = (mouseY - prev.translateY) / prev.scale;
        
        // Calculate new translate to keep mouse point fixed
        const newTranslateX = mouseX - mousePointX * newScale;
        const newTranslateY = mouseY - mousePointY * newScale;
        
        return {
          ...prev,
          scale: newScale,
          translateX: newTranslateX,
          translateY: newTranslateY
        };
      });
    } else {
      // PANNING: Regular wheel (no modifier keys)
      
      // Reduce vertical scrolling speed significantly (it's too fast by default)
      let panX = e.deltaX;
      let panY = e.deltaY;
      
      // Apply much stronger reduction to vertical scrolling
      panY = panY * 0.3; // Reduce vertical speed to 30% of original
      
      // For horizontal scrolling, keep it closer to original
      panX = panX * 0.8; 
      
      // Special case for touchpad diagonal scrolling:
      // If both axes are being scrolled simultaneously, assume it's a touchpad gesture
      const absDeltaX = Math.abs(panX);
      const absDeltaY = Math.abs(panY);
      
      if (absDeltaX > 0 && absDeltaY > 0) {
        // It's likely a touchpad diagonal gesture, balance the speeds
        const maxDelta = Math.max(absDeltaX, absDeltaY);
        const ratio = 0.5; // Make both axes more similar in speed
        
        // Normalize the speeds while preserving direction
        panX = (panX > 0 ? 1 : -1) * maxDelta * ratio;
        panY = (panY > 0 ? 1 : -1) * maxDelta * ratio;
      }
      
      // Reverse the values for natural scrolling (move in direction of pan)
      panX = -panX;
      panY = -panY;
      
      // Apply zoom-dependent speed adjustments
      const basePanSpeed = 1;
      let panSpeed = basePanSpeed;
      
      // Adjust pan speed based on zoom level
      if (viewport.scale > 1) {
        // When zoomed in, slow down panning for finer control
        panSpeed = basePanSpeed * 0.8;
      } else if (viewport.scale < 1) {
        // When zoomed out, make panning faster to cover larger distances
        panSpeed = basePanSpeed * 1.2;
      }
      
      setViewport(prev => ({
        ...prev,
        translateX: prev.translateX + panX * panSpeed,
        translateY: prev.translateY + panY * panSpeed
      }));
    }
  }, [viewport.scale]); // Add viewport.scale as a dependency
  
  // Handle touchpad gestures for pinch zoom
  const handleGestureStart = useCallback((e: any) => {
    e.preventDefault();
    // Store initial scale for the gesture
    setViewport(prev => ({
      ...prev,
      initialScale: prev.scale
    }));
  }, []);
  
  const handleGestureChange = useCallback((e: any) => {
    if (!canvasRef.current || !e.scale) return;
    e.preventDefault();
    
    setViewport(prev => {
      // Use the gesture scale relative to initial scale
      const initialScale = prev.initialScale || prev.scale;
      const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, initialScale * e.scale));
      
      // For gesture, zoom around the center of viewport
      const dropRect = dropRef.current?.getBoundingClientRect();
      if (!dropRect) return prev;
      
      const centerX = dropRect.width / 2;
      const centerY = dropRect.height / 2;
      
      const mousePointX = (centerX - prev.translateX) / prev.scale;
      const mousePointY = (centerY - prev.translateY) / prev.scale;
      
      const newTranslateX = centerX - mousePointX * newScale;
      const newTranslateY = centerY - mousePointY * newScale;
      
      return {
        ...prev,
        scale: newScale,
        translateX: newTranslateX,
        translateY: newTranslateY
      };
    });
  }, []);
  
  // Handle panning with middle mouse button
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      setViewport(prev => ({
        ...prev,
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY
      }));
    }
  }, []);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (viewport.isDragging) {
      const dx = e.clientX - viewport.startX;
      const dy = e.clientY - viewport.startY;
      
      setViewport(prev => ({
        ...prev,
        translateX: prev.translateX + dx,
        translateY: prev.translateY + dy,
        startX: e.clientX,
        startY: e.clientY
      }));
    }
  }, [viewport]);
  
  const handleMouseUp = useCallback(() => {
    setViewport(prev => ({
      ...prev,
      isDragging: false
    }));
  }, []);
  
  // Set up event listeners
  useEffect(() => {
    const dropArea = dropRef.current;
    if (!dropArea) return;
    
    // Enable wheel for both pan and zoom
    dropArea.addEventListener('wheel', handleWheel, { passive: false });
    
    // Enable pan with middle mouse
    dropArea.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Add support for touchpad pinch gestures
    dropArea.addEventListener('gesturestart', handleGestureStart);
    dropArea.addEventListener('gesturechange', handleGestureChange);
    
    return () => {
      dropArea.removeEventListener('wheel', handleWheel);
      dropArea.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dropArea.removeEventListener('gesturestart', handleGestureStart);
      dropArea.removeEventListener('gesturechange', handleGestureChange);
    };
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleGestureStart, handleGestureChange]);

  // Notify parent about viewport changes
  useEffect(() => {
    if (onViewportChange) {
      onViewportChange({
        scale: viewport.scale,
        translateX: viewport.translateX,
        translateY: viewport.translateY
      });
    }
  }, [viewport.scale, viewport.translateX, viewport.translateY, onViewportChange]);

  // Center view on component double-click
  const centerOnComponent = (component: DroppedComponent) => {
    if (!dropRef.current || !canvasRef.current) return;
    
    const dropRect = dropRef.current.getBoundingClientRect();
    const centerX = dropRect.width / 2;
    const centerY = dropRect.height / 2;
    
    setViewport(prev => ({
      ...prev,
      translateX: centerX - component.position.x * prev.scale,
      translateY: centerY - component.position.y * prev.scale
    }));
  };

  // Reset view to show all components
  const resetView = () => {
    if (components.length === 0) {
      // Reset to center if no components
      setViewport({
        scale: 1,
        translateX: 0,
        translateY: 0,
        isDragging: false,
        startX: 0,
        startY: 0
      });
      return;
    }
    
    // Calculate bounds of all components
    const bounds = components.reduce(
      (acc, comp) => {
        const right = comp.position.x + 200; // approximate component width
        const bottom = comp.position.y + 100; // approximate component height
        
        return {
          minX: Math.min(acc.minX, comp.position.x),
          minY: Math.min(acc.minY, comp.position.y),
          maxX: Math.max(acc.maxX, right),
          maxY: Math.max(acc.maxY, bottom)
        };
      },
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );
    
    if (!dropRef.current) return;
    
    const dropRect = dropRef.current.getBoundingClientRect();
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    
    // Calculate scale to fit all components with padding
    const padding = 50;
    const scaleX = (dropRect.width - padding * 2) / width;
    const scaleY = (dropRect.height - padding * 2) / height;
    const scale = Math.min(Math.min(scaleX, scaleY), 1); // Cap at 1x zoom
    
    // Center the components
    const centerX = dropRect.width / 2;
    const centerY = dropRect.height / 2;
    const contentCenterX = bounds.minX + width / 2;
    const contentCenterY = bounds.minY + height / 2;
    
    setViewport({
      scale,
      translateX: centerX - contentCenterX * scale,
      translateY: centerY - contentCenterY * scale,
      isDragging: false,
      startX: 0,
      startY: 0
    });
  };

  // Add a zoom control UI
  const ZoomControls = () => (
    <div className="zoom-controls">
      <button 
        onClick={() => setViewport(prev => ({
          ...prev,
          scale: Math.min(MAX_ZOOM, prev.scale + ZOOM_STEP)
        }))}
        title="Zoom In"
      >
        +
      </button>
      <div className="zoom-level">{Math.round(viewport.scale * 100)}%</div>
      <button 
        onClick={() => setViewport(prev => ({
          ...prev,
          scale: Math.max(MIN_ZOOM, prev.scale - ZOOM_STEP)
        }))}
        title="Zoom Out"
      >
        -
      </button>
      <button onClick={resetView} title="Fit All">
        <span role="img" aria-label="fit all">🔍</span>
      </button>
    </div>
  );

  // Handle component movement
  const handleComponentMove = (instanceId: string, position: { x: number; y: number }) => {
    onMoveComponent(instanceId, position);
  };

  // Handle field value changes
  const handleFieldChange = (instanceId: string, fieldId: string, value: any) => {
    onComponentStateChange(instanceId, fieldId, value);
  };

  // Render a component using the generic component
  const renderComponent = (component: DroppedComponent) => {
    try {
      return (
        <div 
          className="component-container"
          onDoubleClick={() => centerOnComponent(component)}
        >
          <GenericComponent
            componentId={component.instanceId}
            title={component.name}
            fields={component.fields}
            inputs={component.inputs || []}
            outputs={component.outputs || []}
            className={`component ${component.id}`}
            style={{ borderLeftColor: component.color || '#aaa' }}
            onChange={(fieldId, value) => handleFieldChange(component.instanceId, fieldId, value)}
          />
        </div>
      );
    } catch (error) {
      console.error("Error rendering component:", error, component);
      return <div>Error rendering component</div>;
    }
  };

  // Calculate transform value for the canvas
  const transformStyle = {
    transform: `translate(${viewport.translateX}px, ${viewport.translateY}px) scale(${viewport.scale})`,
    transformOrigin: '0 0'
  };

  // Cursor style based on state
  const cursorStyle = {
    cursor: viewport.isDragging ? 'grabbing' : 'default'
  };
  
  // When the workspace loads, reset view if there are components
  useEffect(() => {
    if (components.length > 0) {
      resetView();
    }
  }, [components]);

  return (
    <div
      id="drop-area"
      ref={dropRef}
      className={`drop-area ${isOver ? "drop-area-active" : ""}`}
      style={cursorStyle}
    >
      <div className="grid-background"></div>
      
      <div 
        ref={canvasRef}
        className="canvas" 
        style={transformStyle}
      >
        {/* Dropped components */}
        {components.length === 0 ? (
          <div className="drop-placeholder">Drag and drop components here</div>
        ) : (
          components.map((component) => (
            <div
              key={component.instanceId}
              className="dropped-component"
              data-instance-id={component.instanceId}
              style={{
                position: "absolute",
                left: `${component.position.x}px`,
                top: `${component.position.y}px`,
              }}
            >
              <DragHandle 
                instanceId={component.instanceId}
                onMoveComponent={handleComponentMove}
              />
              {renderComponent(component)}
            </div>
          ))
        )}
      </div>
      
      <ZoomControls />
      
      <div className="canvas-info">
        <div className="info-text">
          Scroll to Pan | Ctrl+Scroll to Zoom | Middle Mouse to Pan<br/>
          Click output node then input node to connect | Right-click connection to delete
        </div>
      </div>
    </div>
  );
};

export default DropArea;