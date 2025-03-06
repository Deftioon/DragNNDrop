import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";
import "./App.css";
import Sidebar from "./components/Sidebar";
import DropArea from "./components/DropArea";
import FloatingMenu from "./components/FloatingMenu";
import ConnectionManager, { Connection } from "./components/ConnectionManager";
import componentsData from "./data/components.json";
import { ThemeProvider, useTheme } from "./theme/ThemeContext";
import { FieldConfig } from "./components/GenericComponent";
import { ConnectionNodeData } from "./components/ConnectionNode";
import { importFromJson, validateImportedData } from "./utils/exportUtils";

export interface ComponentData {
  id: string;
  name: string;
  category?: string;
  color?: string;
  inputs?: ConnectionNodeData[];
  outputs?: ConnectionNodeData[];
  fields: FieldConfig[];
}

export interface DroppedComponent extends ComponentData {
  instanceId: string;
  position: { x: number; y: number };
  state?: Record<string, any>;
}

function AppContent() {
  const { toggleTheme, theme } = useTheme();
  const [droppedComponents, setDroppedComponents] = useState<DroppedComponent[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  const handleDrop = (
    componentId: string,
    position: { x: number; y: number },
  ) => {
    const componentData = componentsData.find(
      (comp) => comp.id === componentId,
    ) as ComponentData;

    if (componentData) {
      const newComponent: DroppedComponent = {
        ...componentData,
        instanceId: uuidv4(),
        position,
        state: {} // Initialize with empty state
      };

      setDroppedComponents((prev) => [...prev, newComponent]);
    }
  };

  const handleMoveComponent = (
    instanceId: string,
    position: { x: number; y: number },
  ) => {
    setDroppedComponents((prev) =>
      prev.map((component) =>
        component.instanceId === instanceId
          ? { ...component, position }
          : component,
      ),
    );
  };

  const handleComponentStateChange = (
    instanceId: string,
    fieldId: string,
    value: any
  ) => {
    setDroppedComponents(prev => 
      prev.map(component => 
        component.instanceId === instanceId 
          ? { 
              ...component, 
              state: { 
                ...component.state, 
                [fieldId]: value 
              } 
            }
          : component
      )
    );
  };

  // Handle connection creation
  const handleCreateConnection = (connectionData: Omit<Connection, 'id'>) => {
    // Check if a similar connection already exists to prevent duplicates
    const exists = connections.some(
      conn =>
        conn.sourceComponentId === connectionData.sourceComponentId &&
        conn.sourceNodeId === connectionData.sourceNodeId &&
        conn.targetComponentId === connectionData.targetComponentId &&
        conn.targetNodeId === connectionData.targetNodeId
    );

    if (!exists) {
      const newConnection: Connection = {
        ...connectionData,
        id: uuidv4()
      };
      
      setConnections(prev => [...prev, newConnection]);
      console.log("Created connection:", newConnection);
    }
  };

  // Handle connection deletion
  const handleDeleteConnection = (connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
  };

  // Add viewport state for connection manager
  const [viewport, setViewport] = useState({ 
    scale: 1, 
    translateX: 0, 
    translateY: 0 
  });
  
  // Handle viewport updates from DropArea
  const handleViewportChange = (newViewport: { 
    scale: number; 
    translateX: number; 
    translateY: number 
  }) => {
    setViewport(newViewport);
  };

  // Handle import of JSON data
  const handleImport = (jsonData: string): boolean => {
    try {
      const importedData = importFromJson(jsonData);
      const validatedData = validateImportedData(importedData);
      
      if (!validatedData) {
        console.error("Failed to validate imported data");
        return false;
      }
      
      // Update application state with imported data
      setDroppedComponents(validatedData.components);
      setConnections(validatedData.connections);
      
      console.log("Successfully imported project:", validatedData.metadata.name);
      return true;
    } catch (error) {
      console.error("Error importing data:", error);
      return false;
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-container">
        <FloatingMenu 
          title="DragNNDrop" 
          components={droppedComponents}
          connections={connections}
          onImport={handleImport}
        />
        <div className="workspace">
          <Sidebar components={componentsData as ComponentData[]} />
          <DropArea
            components={droppedComponents}
            onDrop={handleDrop}
            onMoveComponent={handleMoveComponent}
            onComponentStateChange={handleComponentStateChange}
            onViewportChange={handleViewportChange}
          />
          <ConnectionManager
            connections={connections}
            onCreateConnection={handleCreateConnection}
            onDeleteConnection={handleDeleteConnection}
            viewportTransform={viewport}
          />
        </div>
      </div>
    </DndProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
