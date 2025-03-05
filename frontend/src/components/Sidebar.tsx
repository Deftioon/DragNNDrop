import React, { useRef, useEffect } from "react";
import { useDrag } from "react-dnd";
import { ComponentData } from "../App";
import "./Sidebar.css";

interface SidebarComponentProps {
  component: ComponentData;
}

const SidebarComponent: React.FC<SidebarComponentProps> = ({ component }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "component",
    item: { id: component.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // Create a ref that we'll attach to the div
  const elementRef = useRef<HTMLDivElement>(null);
  
  // Use effect to connect the drag ref to our element
  useEffect(() => {
    if (elementRef.current) {
      drag(elementRef.current);
    }
  }, [drag]);

  return (
    <div 
      className={`component-card ${component.id}`} 
      ref={elementRef}
      style={{ 
        opacity: isDragging ? 0.5 : 1,
        borderLeftColor: component.color || '#ccc'
      }}
    >
      <div className="component-header">
        <h3>{component.name}</h3>
      </div>
      
      <div className="component-info">
        {component.inputs && component.inputs.length > 0 && (
          <span className="component-ports">Inputs: {component.inputs.length}</span>
        )}
        {component.outputs && component.outputs.length > 0 && (
          <span className="component-ports">Outputs: {component.outputs.length}</span>
        )}
      </div>
    </div>
  );
};

interface SidebarProps {
  components: ComponentData[];
}

const Sidebar: React.FC<SidebarProps> = ({ components }) => {
  // Group components by category
  const groupedComponents = components.reduce((acc, component) => {
    const category = component.category || "General";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(component);
    return acc;
  }, {} as Record<string, ComponentData[]>);

  // Helper to capitalize category names
  const capitalizeCategory = (category: string): string => {
    return category.toUpperCase();
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>COMPONENTS</h2>
      </div>

      {Object.entries(groupedComponents).map(([category, categoryComponents]) => (
        <div key={category} className="component-category">
          <h3 className="category-title">
            {capitalizeCategory(category)}
          </h3>
          <div className="component-list">
            {categoryComponents.map((component) => (
              <SidebarComponent key={component.id} component={component} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
