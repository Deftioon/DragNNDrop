import React, { useState, useEffect, useRef, useCallback } from 'react';
import ContextMenu from './ContextMenu';
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
}

const ConnectionManager: React.FC<ConnectionManagerProps> = ({
  connections,
  onCreateConnection,
  onDeleteConnection,
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
  
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    connectionId: string;
  } | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const connectionNodesRef = useRef<Map<string, {
    sourceElement: HTMLElement | null;
    targetElement: HTMLElement | null;
  }>>(new Map());
  
  useEffect(() => {
    const handleNodeClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.classList.contains('node-point')) return;
      
      const componentId = target.getAttribute('data-instance-id');
      const nodeId = target.getAttribute('data-node-id');
      const nodeType = target.getAttribute('data-node-type') as 'input' | 'output';
      const dataType = target.getAttribute('data-node-data-type');
      
      if (!componentId || !nodeId || !nodeType || !dataType) return;
      
      if (startNode) {
        if (startNode.componentId === componentId && startNode.nodeId === nodeId) {
          setStartNode(null);
          setPreviewLine(null);
          return;
        }
        
        if (startNode.nodeType === nodeType) {
          setStartNode(null);
          setPreviewLine(null);
          return;
        }
        
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
        
        const sourceType = Array.isArray(source.dataType) ? source.dataType : [source.dataType];
        const targetType = Array.isArray(target.dataType) ? target.dataType : [target.dataType];
        
        const isCompatible = sourceType.some(s => 
          targetType.some(t => 
            t === s || t === '*' || s === '*'
          )
        );
        
        if (isCompatible) {
          onCreateConnection({
            sourceComponentId: source.componentId,
            sourceNodeId: source.nodeId,
            targetComponentId: target.componentId,
            targetNodeId: target.nodeId,
            sourceType: source.dataType,
            targetType: target.dataType
          });
        }
        
        setStartNode(null);
        setPreviewLine(null);
      } else {
        setStartNode({
          componentId,
          nodeId,
          nodeType,
          dataType: dataType.split(','),
          element: target
        });
        
        const rect = target.getBoundingClientRect();
        const svgRect = svgRef.current!.getBoundingClientRect();
        
        const svgX = rect.left + rect.width / 2 - svgRect.left;
        const svgY = rect.top + rect.height / 2 - svgRect.top;
        
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
      
      const svgRect = svgRef.current.getBoundingClientRect();
      
      const svgMouseX = e.clientX - svgRect.left;
      const svgMouseY = e.clientY - svgRect.top;
      
      setPreviewLine(prev => ({
        ...prev!,
        x2: svgMouseX,
        y2: svgMouseY
      }));
    };
    
    const handleConnectionRightClick = (e: MouseEvent) => {
      const target = e.target as SVGElement;
      
      if (target.tagName === 'path' && target.classList.contains('connection-line')) {
        e.preventDefault();
        
        const connectionId = target.getAttribute('data-connection-id');
        if (connectionId) {
          setContextMenu({
            x: e.clientX,
            y: e.clientY,
            connectionId
          });
        }
      } else {
        setContextMenu(null);
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
  }, [startNode, previewLine, onCreateConnection]);
  
  const findNodeElements = useCallback(() => {
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
    
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateConnectionPositions);
    });
    
    const container = document.querySelector('.drop-area');
    if (container) {
      resizeObserver.observe(container);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [connections, findNodeElements]);
  
  const updateConnectionPositions = useCallback(() => {
    if (!svgRef.current) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    
    connectionNodesRef.current.forEach((nodes, connId) => {
      if (!nodes.sourceElement || !nodes.targetElement) return;
      
      const sourceRect = nodes.sourceElement.getBoundingClientRect();
      const targetRect = nodes.targetElement.getBoundingClientRect();
      
      const sourceX = sourceRect.left + sourceRect.width / 2;
      const sourceY = sourceRect.top + sourceRect.height / 2;
      const targetX = targetRect.left + targetRect.width / 2;
      const targetY = targetRect.top + targetRect.height / 2;
      
      const svgSourceX = sourceX - svgRect.left;
      const svgSourceY = sourceY - svgRect.top;
      const svgTargetX = targetX - svgRect.left;
      const svgTargetY = targetY - svgRect.top;
      
      const dx = Math.abs(svgTargetX - svgSourceX) * 0.5;
      
      const pathData = `M${svgSourceX},${svgSourceY} C${svgSourceX + dx},${svgSourceY} ${svgTargetX - dx},${svgTargetY} ${svgTargetX},${svgTargetY}`;
      
      const path = document.querySelector(`[data-connection-id="${connId}"]`);
      if (path) {
        (path as SVGPathElement).setAttribute('d', pathData);
      }
    });
  }, []);
  
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
  
  const generateBezierPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.abs(x2 - x1) * 0.5;
    return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
  };
  
  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };
  
  const handleDeleteConnection = () => {
    if (contextMenu) {
      onDeleteConnection(contextMenu.connectionId);
      setContextMenu(null);
    }
  };
  
  const getConnectionColor = (sourceType: string | string[]) => {
    const sourceTypeStr = Array.isArray(sourceType) ? sourceType[0] : sourceType;
    
    switch(sourceTypeStr) {
      case 'text': return 'var(--color-primary)';
      case 'image': return 'var(--color-secondary)';
      case 'number': return 'var(--color-error)';
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
        <g className="connections-container">
          {connections.map(conn => (
            <path
              key={conn.id}
              data-connection-id={conn.id}
              className="connection-line"
              d="M0,0 C0,0 0,0 0,0"
              stroke={getConnectionColor(conn.sourceType)}
              strokeWidth={2} 
              fill="none"
            />
          ))}

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
      
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={handleCloseContextMenu}
          onDelete={handleDeleteConnection}
        />
      )}
    </div>
  );
};

export default ConnectionManager;
