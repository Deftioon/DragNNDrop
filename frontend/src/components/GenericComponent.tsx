import React from 'react';
import './GenericComponent.css';
import ConnectionNode, { ConnectionNodeData } from './ConnectionNode';

export interface FieldConfig {
  type: 'text' | 'file' | 'button' | 'display' | 'select' | 'checkbox' | 'number';
  id: string;
  label?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
  props?: Record<string, any>;
}

interface GenericComponentProps {
  componentId: string;
  title?: string;
  fields: FieldConfig[];
  className?: string;
  style?: React.CSSProperties;
  inputs?: ConnectionNodeData[];
  outputs?: ConnectionNodeData[];
  onChange?: (fieldId: string, value: any) => void;
  onAction?: (fieldId: string, action: string) => void;
}

const GenericComponent: React.FC<GenericComponentProps> = ({
  componentId,
  title,
  fields,
  className = '',
  style = {},
  inputs = [],
  outputs = [],
  onChange,
  onAction
}) => {
  const renderField = (field: FieldConfig) => {
    const { type, id, label, placeholder, props = {}, options = [], defaultValue } = field;
    const fieldId = `${componentId}-${id}`;
    
    switch (type) {
      case 'text':
        return (
          <div className="component-field text-field" key={id}>
            {label && <label htmlFor={fieldId}>{label}</label>}
            <input 
              id={fieldId}
              type="text" 
              placeholder={placeholder}
              defaultValue={defaultValue}
              onChange={(e) => onChange?.(id, e.target.value)}
              {...props}
            />
          </div>
        );
      
      case 'number':
        return (
          <div className="component-field number-field" key={id}>
            {label && <label htmlFor={fieldId}>{label}</label>}
            <input 
              id={fieldId}
              type="number" 
              placeholder={placeholder}
              defaultValue={defaultValue}
              onChange={(e) => onChange?.(id, e.target.valueAsNumber)}
              {...props}
            />
          </div>
        );
        
      case 'file':
        return (
          <div className="component-field file-field" key={id}>
            {label && <label htmlFor={fieldId}>{label}</label>}
            <input 
              id={fieldId}
              type="file"
              onChange={(e) => onChange?.(id, e.target.files?.[0])}
              {...props}
            />
          </div>
        );
        
      case 'select':
        return (
          <div className="component-field select-field" key={id}>
            {label && <label htmlFor={fieldId}>{label}</label>}
            <select
              id={fieldId}
              defaultValue={defaultValue}
              onChange={(e) => onChange?.(id, e.target.value)}
              {...props}
            >
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
        
      case 'checkbox':
        return (
          <div className="component-field checkbox-field" key={id}>
            <input 
              id={fieldId}
              type="checkbox"
              defaultChecked={defaultValue}
              onChange={(e) => onChange?.(id, e.target.checked)}
              {...props}
            />
            {label && <label htmlFor={fieldId}>{label}</label>}
          </div>
        );
      
      case 'button':
        return (
          <div className="component-field button-field" key={id}>
            <button 
              id={fieldId}
              className="component-button"
              onClick={() => onAction?.(id, 'click')}
              {...props}
            >
              {label || 'Button'}
            </button>
          </div>
        );
        
      case 'display':
        return (
          <div className="component-field display-field" key={id}>
            {label && <label>{label}</label>}
            <div className="display-content" {...props}>
              {placeholder || 'Output will appear here'}
            </div>
          </div>
        );
        
      default:
        return <div key={id}>Unknown field type: {type}</div>;
    }
  };

  return (
    <div className={`generic-component ${className}`} style={style}>
      <div className="component-content">
        {/* Input nodes */}
        {inputs.length > 0 && (
          <div className="input-nodes">
            {inputs.map(inputData => (
              <ConnectionNode 
                key={inputData.id}
                data={inputData}
                nodeType="input"
                instanceId={componentId}
              />
            ))}
          </div>
        )}

        {/* Component fields */}
        <div className="component-main">
          {title && <h3 className="component-title">{title}</h3>}
          <div className="component-fields">
            {fields.map(renderField)}
          </div>
        </div>

        {/* Output nodes */}
        {outputs.length > 0 && (
          <div className="output-nodes">
            {outputs.map(outputData => (
              <ConnectionNode 
                key={outputData.id}
                data={outputData}
                nodeType="output"
                instanceId={componentId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenericComponent;
