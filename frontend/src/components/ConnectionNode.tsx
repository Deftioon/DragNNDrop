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
}

const ConnectionNode: React.FC<ConnectionNodeProps> = ({ 
  data, 
  nodeType,
  instanceId 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const dataType = Array.isArray(data.type) ? data.type.join(',') : data.type;

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
