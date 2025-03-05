import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { DroppedComponent } from '../App';
import { Connection } from './ConnectionManager';
import { exportToJson } from '../utils/exportUtils';
import './FloatingMenu.css';

interface FloatingMenuProps {
  title: string;
  components?: DroppedComponent[];
  connections?: Connection[];
  onImport?: (jsonData: string) => boolean;
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ 
  title, 
  components = [], 
  connections = [],
  onImport
}) => {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [exportName, setExportName] = useState('dragndrop-export');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setShowExportDialog(false);
        setShowImportDialog(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setShowExportDialog(false);
    setShowImportDialog(false);
  };

  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'export':
        setShowExportDialog(true);
        setShowImportDialog(false);
        break;
      case 'import':
        setShowImportDialog(true);
        setShowExportDialog(false);
        break;
      case 'save':
        alert('Save functionality not yet implemented');
        setIsMenuOpen(false);
        break;
      case 'load':
        alert('Load functionality not yet implemented');
        setIsMenuOpen(false);
        break;
      default:
        setIsMenuOpen(false);
        setShowExportDialog(false);
        setShowImportDialog(false);
        break;
    }
  };

  const handleExport = () => {
    exportToJson(components, connections, exportName);
    setShowExportDialog(false);
    setIsMenuOpen(false);
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportError(null);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = event.target?.result as string;
        
        if (onImport && onImport(jsonData)) {
          setShowImportDialog(false);
          setIsMenuOpen(false);
        } else {
          setImportError('Invalid project file');
        }
      } catch (error) {
        console.error('Error reading file:', error);
        setImportError('Could not read file');
      }
    };
    
    reader.onerror = () => {
      setImportError('Error reading file');
    };
    
    reader.readAsText(file);
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="floating-menu-container" ref={menuRef}>
      <div 
        className="floating-badge" 
        onClick={toggleMenu}
        aria-expanded={isMenuOpen}
        role="button"
        aria-label="Menu"
        tabIndex={0}
      >
        <span className="badge-title">{title}</span>
        <span className="badge-arrow">{isMenuOpen ? '▲' : '▼'}</span>
      </div>
      
      {isMenuOpen && !showExportDialog && !showImportDialog && (
        <div className="menu-dropdown">
          <div className="menu-item" onClick={() => handleMenuAction('export')}>
            <span className="menu-icon">📤</span> Export
          </div>
          <div className="menu-item" onClick={() => handleMenuAction('import')}>
            <span className="menu-icon">📥</span> Import
          </div>
          <div className="menu-item" onClick={() => handleMenuAction('save')}>
            <span className="menu-icon">💾</span> Save
          </div>
          <div className="menu-item" onClick={() => handleMenuAction('load')}>
            <span className="menu-icon">📂</span> Load
          </div>
          <div className="menu-divider"></div>
          <div className="menu-item" onClick={toggleTheme}>
            <span className="menu-icon">{theme.name === "Dark" ? "☀️" : "🌙"}</span>
            Switch to {theme.name === "Dark" ? "Light" : "Dark"} Mode
          </div>
        </div>
      )}
      
      {showExportDialog && (
        <div className="export-dialog">
          <h3>Export Project</h3>
          <div className="export-form">
            <label htmlFor="export-name">Filename:</label>
            <input 
              id="export-name"
              type="text" 
              value={exportName} 
              onChange={(e) => setExportName(e.target.value)}
              placeholder="Enter filename"
            />
          </div>
          <div className="export-summary">
            <p>Components: {components.length}</p>
            <p>Connections: {connections.length}</p>
          </div>
          <div className="export-actions">
            <button 
              className="cancel-button" 
              onClick={() => setShowExportDialog(false)}
            >
              Cancel
            </button>
            <button 
              className="export-button"
              onClick={handleExport}
              disabled={components.length === 0}
            >
              Export
            </button>
          </div>
        </div>
      )}
      
      {showImportDialog && (
        <div className="import-dialog">
          <h3>Import Project</h3>
          <div className="import-instructions">
            <p>Select a project file (.json) to import</p>
            {importError && <p className="import-error">{importError}</p>}
          </div>
          <input 
            type="file" 
            ref={fileInputRef}
            className="file-input" 
            accept=".json"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <div className="import-actions">
            <button 
              className="cancel-button" 
              onClick={() => setShowImportDialog(false)}
            >
              Cancel
            </button>
            <button 
              className="import-button"
              onClick={triggerFileInput}
            >
              Select File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingMenu;
