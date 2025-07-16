// Core schema types for the JSON UI Editor

export type ControlType = 'text' | 'email' | 'password' | 'select' | 'checkbox' | 'button' | 'textarea' | 'number';

export type LayoutType = 'vertical' | 'horizontal' | 'grid';

export interface SelectOption {
  label: string;
  value: string;
}

export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  customMessage?: string;
}

export interface UIControl {
  id: string;
  type: ControlType;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRules;
  options?: SelectOption[];
  className?: string;
}

export interface UISchema {
  title?: string;
  description?: string;
  layout: LayoutType;
  controls: UIControl[];
}

export interface ValidationError {
  type: 'schema' | 'control' | 'validation';
  controlId?: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface EditorState {
  schema: UISchema;
  selectedControlId: string | null;
  mode: 'visual' | 'json';
  errors: ValidationError[];
  isDirty: boolean;
}

export interface SavedSchema {
  id: string;
  name: string;
  schema: UISchema;
  created: string;
  modified: string;
}