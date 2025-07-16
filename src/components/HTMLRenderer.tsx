import React from 'react';
import { UISchema, UIControl, ValidationRules } from '../types/schema';
import './HTMLRenderer.css';

export interface HTMLRendererProps {
  schema: UISchema;
  onSubmit?: (data: Record<string, any>) => void;
  className?: string;
}

/**
 * HTMLRenderer component that converts UISchema to HTML form
 * Supports all control types and maps validation rules to HTML5 attributes
 */
export const HTMLRenderer: React.FC<HTMLRendererProps> = ({
  schema,
  onSubmit,
  className = ''
}) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (onSubmit) {
      const formData = new FormData(event.currentTarget);
      const data: Record<string, any> = {};
      
      // Process form data based on control types
      schema.controls.forEach(control => {
        const value = formData.get(control.name);
        
        switch (control.type) {
          case 'checkbox':
            data[control.name] = value === 'on';
            break;
          case 'number':
            data[control.name] = value ? Number(value) : undefined;
            break;
          default:
            data[control.name] = value || undefined;
        }
      });
      
      onSubmit(data);
    }
  };

  const getLayoutClassName = (layout: string): string => {
    switch (layout) {
      case 'horizontal':
        return 'form-layout-horizontal';
      case 'grid':
        return 'form-layout-grid';
      case 'vertical':
      default:
        return 'form-layout-vertical';
    }
  };

  const renderControl = (control: UIControl): React.ReactNode => {
    const commonProps = {
      id: control.id,
      name: control.name,
      className: control.className || '',
      'aria-label': control.label,
    };

    const validationProps = getValidationAttributes(control.validation);

    switch (control.type) {
      case 'text':
      case 'email':
      case 'password':
        return (
          <div key={control.id} className="form-control-group">
            <label htmlFor={control.id} className="form-label">
              {control.label}
              {control.required && <span className="required-indicator" aria-label="required">*</span>}
            </label>
            <input
              {...commonProps}
              type={control.type}
              placeholder={control.placeholder}
              required={control.required}
              {...validationProps}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={control.id} className="form-control-group">
            <label htmlFor={control.id} className="form-label">
              {control.label}
              {control.required && <span className="required-indicator" aria-label="required">*</span>}
            </label>
            <textarea
              {...commonProps}
              placeholder={control.placeholder}
              required={control.required}
              {...validationProps}
            />
          </div>
        );

      case 'number':
        return (
          <div key={control.id} className="form-control-group">
            <label htmlFor={control.id} className="form-label">
              {control.label}
              {control.required && <span className="required-indicator" aria-label="required">*</span>}
            </label>
            <input
              {...commonProps}
              type="number"
              placeholder={control.placeholder}
              required={control.required}
              {...validationProps}
            />
          </div>
        );

      case 'select':
        return (
          <div key={control.id} className="form-control-group">
            <label htmlFor={control.id} className="form-label">
              {control.label}
              {control.required && <span className="required-indicator" aria-label="required">*</span>}
            </label>
            <select
              {...commonProps}
              required={control.required}
            >
              {!control.required && (
                <option value="">-- Select an option --</option>
              )}
              {control.options?.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'checkbox':
        return (
          <div key={control.id} className="form-control-group form-control-checkbox">
            <label htmlFor={control.id} className="form-label checkbox-label">
              <input
                {...commonProps}
                type="checkbox"
                required={control.required}
              />
              <span className="checkbox-text">
                {control.label}
                {control.required && <span className="required-indicator" aria-label="required">*</span>}
              </span>
            </label>
          </div>
        );

      case 'button':
        return (
          <div key={control.id} className="form-control-group">
            <button
              {...commonProps}
              type={control.name === 'submit' ? 'submit' : 'button'}
              className={`form-button ${control.className || ''}`}
            >
              {control.label}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // If schema is empty or has no controls, show placeholder
  if (!schema.controls || schema.controls.length === 0) {
    return (
      <div className={`html-renderer empty-state ${className}`}>
        <p className="empty-message">No form controls defined. Add controls to see the preview.</p>
      </div>
    );
  }

  return (
    <div className={`html-renderer ${className}`}>
      <form 
        onSubmit={handleSubmit}
        className={`form ${getLayoutClassName(schema.layout)}`}
        noValidate
        role="form"
      >
        {schema.title && (
          <h2 className="form-title">{schema.title}</h2>
        )}
        
        {schema.description && (
          <p className="form-description">{schema.description}</p>
        )}

        <div className="form-controls">
          {schema.controls.map(renderControl)}
        </div>
      </form>
    </div>
  );
};

/**
 * Maps validation rules to HTML5 validation attributes
 */
function getValidationAttributes(validation?: ValidationRules): Record<string, any> {
  if (!validation) return {};

  const attributes: Record<string, any> = {};

  if (validation.minLength !== undefined) {
    attributes.minLength = validation.minLength;
  }

  if (validation.maxLength !== undefined) {
    attributes.maxLength = validation.maxLength;
  }

  if (validation.pattern) {
    attributes.pattern = validation.pattern;
  }

  if (validation.min !== undefined) {
    attributes.min = validation.min;
  }

  if (validation.max !== undefined) {
    attributes.max = validation.max;
  }

  if (validation.customMessage) {
    attributes.title = validation.customMessage;
  }

  return attributes;
}

export default HTMLRenderer;