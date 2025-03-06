import React, { useState } from 'react';
import './ConnectionNode.css';

export interface ConnectionNodeData {
  id: string;
  name: string;
  type: string | string[];
}

interface ConnectionNodeProps {
  data: ConnectionNodeData;
  nodeType: 'input' | 'output';
  instanceId: string;
  color?: string; // Add color prop
}

const ConnectionNode: React.FC<ConnectionNodeProps> = ({ 
  data, 
  nodeType,
  instanceId,
  color // Accept color from parent
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const dataType = Array.isArray(data.type) ? data.type.join(',') : data.type;

  // Style override for this specific node
  const nodeStyle = color ? {
    backgroundColor: isHovered ? color : `${color}99`, // Make it slightly transparent when not hovered
    borderColor: color
  } : undefined;

  return (
    <div 
      className={`connection-node ${nodeType}-node`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className="node-point"
        data-node-id={data.id}
        data-instance-id={instanceId}
        data-node-type={nodeType}
        data-node-data-type={dataType}
        data-node-color={color} // Add color as data attribute
        style={nodeStyle}
        title={data.name}
      />
      {isHovered && (
        <div className={`node-tooltip ${nodeType === 'input' ? 'left' : 'right'}`}>
          {data.name}: {dataType}
        </div>
      )}
    </div>
  );
};

export default ConnectionNode;
