import { DroppedComponent } from "../App";
import { Connection } from "../components/ConnectionManager";

export interface ExportData {
  version: string;
  components: DroppedComponent[];
  connections: Connection[];
  metadata: {
    exportDate: string;
    name: string;
  };
}

export const exportToJson = (
  components: DroppedComponent[],
  connections: Connection[],
  filename = 'dragndrop-export'
): void => {
  const exportData: ExportData = {
    version: '1.0.0',
    components,
    connections,
    metadata: {
      exportDate: new Date().toISOString(),
      name: filename,
    }
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const importFromJson = (jsonData: string): ExportData | null => {
  try {
    const parsed = JSON.parse(jsonData) as ExportData;
    
    if (!parsed.components || !parsed.connections || !parsed.version) {
      console.error('Invalid export file format');
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('Error parsing JSON data:', error);
    return null;
  }
};

export const validateImportedData = (data: any): ExportData | null => {
  try {
    if (!data || typeof data !== 'object') return null;
    
    if (!data.version || !Array.isArray(data.components) || !Array.isArray(data.connections)) {
      console.error('Invalid export file structure: Missing required properties');
      return null;
    }
    
    const versionParts = data.version.split('.').map(Number);
    const currentVersion = '1.0.0'.split('.').map(Number);
    
    if (versionParts[0] !== currentVersion[0]) {
      console.error(`Incompatible version: ${data.version} (current: 1.0.0)`);
      return null;
    }
    
    return data as ExportData;
  } catch (error) {
    console.error('Error validating imported data:', error);
    return null;
  }
};
