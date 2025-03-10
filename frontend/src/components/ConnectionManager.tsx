import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ConnectionManager.css';

export interface Connection {
  id: string;
  sourceComponentId: string;
  sourceNodeId: string;
  targetComponentId: string;
  targetNodeId: string;
  sourceType: string | string[];
  targetType: string | string[];
}

interface ConnectionManagerProps {
  connections: Connection[];
  onCreateConnection: (connection: Omit<Connection, 'id'>) => void;
  onDeleteConnection: (connectionId: string) => void;
  viewportTransform?: { scale: number; translateX: number; translateY: number };
}

const ConnectionManager: React.FC<ConnectionManagerProps> = ({
  connections,
  onCreateConnection,
  onDeleteConnection,
  viewportTransform = { scale: 1, translateX: 0, translateY: 0 }
}) => {
  const [startNode, setStartNode] = useState<{
    componentId: string;
    nodeId: string;
    nodeType: 'input' | 'output';
    dataType: string | string[];
    element: HTMLElement;
  } | null>(null);
  
  const [previewLine, setPreviewLine] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const connectionNodesRef = useRef<Map<string, {
    sourceElement: HTMLElement | null;
    targetElement: HTMLElement | null;
  }>>(new Map());
  
  // Setup event listeners for node click and mousemove
  useEffect(() => {
    const handleNodeClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('node-point')) return;
      
      const componentId = target.getAttribute('data-instance-id');
      const nodeId = target.getAttribute('data-node-id');
      const nodeType = target.getAttribute('data-node-type') as 'input' | 'output';
      const dataType = target.getAttribute('data-node-data-type');
      
      if (!componentId || !nodeId || !nodeType || !dataType) return;
      
      // If we already have a start node
      if (startNode) {
        // Don't connect to the same node
        if (startNode.componentId === componentId && startNode.nodeId === nodeId) {
          setStartNode(null);
          setPreviewLine(null);
          return;
        }
        
        // Don't connect input to input or output to output
        if (startNode.nodeType === nodeType) {
          setStartNode(null);
          setPreviewLine(null);
          return;
        }
        
        // Determine source (output) and target (input) nodes
        let source, target;
        if (startNode.nodeType === 'output') {
          source = {
            componentId: startNode.componentId,
            nodeId: startNode.nodeId,
            dataType: startNode.dataType
          };
          target = {
            componentId,
            nodeId,
            dataType: dataType.split(',')
          };
        } else {
          source = {
            componentId,
            nodeId,
            dataType: dataType.split(',')
          };
          target = {
            componentId: startNode.componentId,
            nodeId: startNode.nodeId,
            dataType: startNode.dataType
          };
        }
        
        // Check compatibility
        const sourceType = Array.isArray(source.dataType) ? source.dataType : [source.dataType];
        const targetType = Array.isArray(target.dataType) ? target.dataType : [target.dataType];
        
        const isCompatible = sourceType.some(s => 
          targetType.some(t => 
            t === s || t === '*' || s === '*'
          )
        );
        
        if (isCompatible) {
          // Create the connection
          onCreateConnection({
            sourceComponentId: source.componentId,
            sourceNodeId: source.nodeId,
            targetComponentId: target.componentId,
            targetNodeId: target.nodeId,
            sourceType: source.dataType,
            targetType: target.dataType
          });
        }
        
        // Reset state
        setStartNode(null);
        setPreviewLine(null);
      } else {
        // Start new connection using screen coordinates
        setStartNode({
          componentId,
          nodeId,
          nodeType,
          dataType: dataType.split(','),
          element: target
        });
        
        // Get position in screen coordinates
        const rect = target.getBoundingClientRect();
        const svgRect = svgRef.current!.getBoundingClientRect();
        
        // Calculate center of node in SVG coordinates
        const svgX = rect.left + rect.width / 2 - svgRect.left;
        const svgY = rect.top + rect.height / 2 - svgRect.top;
        
        // Set preview line with screen coordinates
        setPreviewLine({
          x1: svgX,
          y1: svgY,
          x2: svgX,
          y2: svgY
        });
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!startNode || !previewLine || !svgRef.current) return;
      
      // Get SVG coordinates
      const svgRect = svgRef.current.getBoundingClientRect();
      
      // Get mouse position relative to SVG (in screen coordinates)
      const svgMouseX = e.clientX - svgRect.left;
      const svgMouseY = e.clientY - svgRect.top;
      
      // Update the preview line directly in screen coordinates
      setPreviewLine(prev => ({
        ...prev!,
        x2: svgMouseX,
        y2: svgMouseY
      }));
    };
    
    const handleConnectionRightClick = (e: MouseEvent) => {
      const target = e.target as SVGElement;
      
      // Check if right-clicked on a connection
      if (target.tagName === 'path' && target.classList.contains('connection-line')) {
        e.preventDefault();
        
        const connectionId = target.getAttribute('data-connection-id');
        if (connectionId) {
          // Delete the connection immediately without showing a context menu
          onDeleteConnection(connectionId);
        }
      }
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && startNode) {
        setStartNode(null);
        setPreviewLine(null);
      }
    };
    
    document.addEventListener('click', handleNodeClick);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('contextmenu', handleConnectionRightClick);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('click', handleNodeClick);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('contextmenu', handleConnectionRightClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [startNode, previewLine, onCreateConnection, onDeleteConnection]);
  
  // Optimize connection position tracking
  const findNodeElements = useCallback(() => {
    // Find and store all node elements once
    connections.forEach(conn => {
      const sourceNode = document.querySelector(
        `[data-instance-id="${conn.sourceComponentId}"][data-node-id="${conn.sourceNodeId}"]`
      ) as HTMLElement;
      
      const targetNode = document.querySelector(
        `[data-instance-id="${conn.targetComponentId}"][data-node-id="${conn.targetNodeId}"]`
      ) as HTMLElement;
      
      connectionNodesRef.current.set(conn.id, {
        sourceElement: sourceNode,
        targetElement: targetNode
      });
    });
  }, [connections]);
  
  useEffect(() => {
    findNodeElements();
    
    // Use ResizeObserver instead of MutationObserver to detect position changes
    const resizeObserver = new ResizeObserver(() => {
      // Nodes moved, request animation frame for smooth rendering
      requestAnimationFrame(updateConnectionPositions);
    });
    
    // Observe the parent container rather than the entire document
    const container = document.querySelector('.drop-area');
    if (container) {
      resizeObserver.observe(container);
    }
    
    // Cleanup
    return () => {
      resizeObserver.disconnect();
    };
  }, [connections, findNodeElements]);
  
  // Update connection positions - fixed to handle screen coordinates correctly
  const updateConnectionPositions = useCallback(() => {
    if (!svgRef.current) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    
    // Update each connection line
    connectionNodesRef.current.forEach((nodes, connId) => {
      if (!nodes.sourceElement || !nodes.targetElement) return;
      
      // Get node positions in screen coordinates
      const sourceRect = nodes.sourceElement.getBoundingClientRect();
      const targetRect = nodes.targetElement.getBoundingClientRect();
      
      // Calculate node centers in client (screen) coordinates
      const sourceX = sourceRect.left + sourceRect.width / 2;
      const sourceY = sourceRect.top + sourceRect.height / 2;
      const targetX = targetRect.left + targetRect.width / 2;
      const targetY = targetRect.top + targetRect.height / 2;
      
      // Convert to SVG coordinates (relative to the SVG element)
      const svgSourceX = sourceX - svgRect.left;
      const svgSourceY = sourceY - svgRect.top;
      const svgTargetX = targetX - svgRect.left;
      const svgTargetY = targetY - svgRect.top;
      
      // Calculate bezier control points
      const dx = Math.abs(svgTargetX - svgSourceX) * 0.5;
      
      // Generate path using screen coordinates
      const pathData = `M${svgSourceX},${svgSourceY} C${svgSourceX + dx},${svgSourceY} ${svgTargetX - dx},${svgTargetY} ${svgTargetX},${svgTargetY}`;
      
      // Find and update the path
      const path = document.querySelector(`[data-connection-id="${connId}"]`);
      if (path) {
        (path as SVGPathElement).setAttribute('d', pathData);
      }
    });
  }, []); // No dependencies needed as we calculate everything fresh each time
  
  // Use requestAnimationFrame for smooth rendering
  useEffect(() => {
    let animationFrameId: number;
    
    const renderFrame = () => {
      updateConnectionPositions();
      animationFrameId = requestAnimationFrame(renderFrame);
    };
    
    animationFrameId = requestAnimationFrame(renderFrame);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [updateConnectionPositions]);
  
  // Generate bezier control points for smooth curves
  const generateBezierPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.abs(x2 - x1) * 0.5;
    return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
  };
  
  // Get connection type color
  const getConnectionColor = (sourceType: string | string[], targetType: string | string[], sourceElement: HTMLElement | null) => {
    // Try to use the color from the node itself if available
    if (sourceElement) {
      const nodeColor = sourceElement.getAttribute('data-node-color');
      if (nodeColor) return nodeColor;
    }
    
    // Fallback to type-based coloring
    const sourceTypeStr = Array.isArray(sourceType) ? sourceType[0] : sourceType;
    
    switch(sourceTypeStr) {
      case 'text': return 'var(--color-primary)';
      case 'image': return 'var(--color-secondary)';
      case 'number': return 'var(--color-error)';
      case 'tensor': return '#9C27B0';
      case 'kernel': return '#FF9800';
      case 'activation': return '#00BCD4';
      case 'loss': return '#F44336';
      case 'optimizer': return '#F44336';
      case 'fc_property': return '#FF9800';
      default: return 'var(--color-text-secondary)';
    }
  };
  
  return (
    <div className="connection-manager">
      <svg 
        ref={svgRef} 
        className="connections-svg"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        {/* Fixed background layer for connections */}
        <g className="connections-container">
          {/* Draw actual connections in screen coordinates */}
          {connections.map(conn => {
            const nodes = connectionNodesRef.current.get(conn.id);
            const sourceElement = nodes?.sourceElement;
            
            return (
              <path
                key={conn.id}
                data-connection-id={conn.id}
                className="connection-line"
                d="M0,0 C0,0 0,0 0,0" // Placeholder path to be updated by the animation frame
                stroke={getConnectionColor(conn.sourceType, conn.targetType, sourceElement)}
                strokeWidth={2} 
                fill="none"
              />
            );
          })}

          {/* Preview line in screen coordinates */}
          {previewLine && (
            <path
              className="preview-connection-line"
              d={generateBezierPath(
                previewLine.x1,
                previewLine.y1,
                previewLine.x2,
                previewLine.y2
              )}
              stroke="var(--color-primary)"
              strokeWidth={2}
              strokeDasharray="5,5"
              fill="none"
            />
          )}
        </g>
      </svg>
    </div>
  );
};

export default ConnectionManager;
