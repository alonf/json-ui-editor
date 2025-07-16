import { z } from 'zod';
import { 
  UIControl, 
  ValidationError,
  ControlType
} from '../types/schema';

// Zod schemas for runtime validation
export const ControlTypeSchema = z.enum(['text', 'email', 'password', 'select', 'checkbox', 'button', 'textarea', 'number']);

export const LayoutTypeSchema = z.enum(['vertical', 'horizontal', 'grid']);

export const SelectOptionSchema = z.object({
  label: z.string().min(1, 'Option label cannot be empty'),
  value: z.string().min(1, 'Option value cannot be empty'),
});

export const ValidationRulesSchema = z.object({
  minLength: z.number().min(0).optional(),
  maxLength: z.number().min(0).optional(),
  pattern: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  customMessage: z.string().optional(),
}).refine((data) => {
  // Ensure minLength <= maxLength if both are provided
  if (data.minLength !== undefined && data.maxLength !== undefined) {
    return data.minLength <= data.maxLength;
  }
  return true;
}, {
  message: 'minLength must be less than or equal to maxLength',
  path: ['minLength']
}).refine((data) => {
  // Ensure min <= max if both are provided
  if (data.min !== undefined && data.max !== undefined) {
    return data.min <= data.max;
  }
  return true;
}, {
  message: 'min must be less than or equal to max',
  path: ['min']
});

export const UIControlSchema = z.object({
  id: z.string().min(1, 'Control ID cannot be empty'),
  type: ControlTypeSchema,
  label: z.string().min(1, 'Control label cannot be empty'),
  name: z.string().min(1, 'Control name cannot be empty').regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Control name must be a valid identifier'),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  validation: ValidationRulesSchema.optional(),
  options: z.array(SelectOptionSchema).optional(),
  className: z.string().optional(),
}).refine((data) => {
  // Select controls must have options
  if (data.type === 'select' && (!data.options || data.options.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Select controls must have at least one option',
  path: ['options']
}).refine((data) => {
  // Non-select controls should not have options
  if (data.type !== 'select' && data.options && data.options.length > 0) {
    return false;
  }
  return true;
}, {
  message: 'Only select controls can have options',
  path: ['options']
});

export const UISchemaSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  layout: LayoutTypeSchema,
  controls: z.array(UIControlSchema),
}).refine((data) => {
  // Check for unique control IDs
  const ids = data.controls.map(control => control.id);
  const uniqueIds = new Set(ids);
  return ids.length === uniqueIds.size;
}, {
  message: 'Control IDs must be unique',
  path: ['controls']
}).refine((data) => {
  // Check for unique control names
  const names = data.controls.map(control => control.name);
  const uniqueNames = new Set(names);
  return names.length === uniqueNames.size;
}, {
  message: 'Control names must be unique',
  path: ['controls']
});

// Validation utility functions
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a complete UI schema
 */
export function validateUISchema(schema: unknown): ValidationResult {
  const result = UISchemaSchema.safeParse(schema);
  
  if (result.success) {
    return {
      isValid: true,
      errors: []
    };
  }

  const errors: ValidationError[] = result.error.issues.map(issue => ({
    type: 'schema' as const,
    field: issue.path.join('.'),
    message: issue.message,
    severity: 'error' as const
  }));

  return {
    isValid: false,
    errors
  };
}

/**
 * Validates a single UI control
 */
export function validateUIControl(control: unknown, existingControls: UIControl[] = []): ValidationResult {
  const result = UIControlSchema.safeParse(control);
  
  if (!result.success) {
    const errors: ValidationError[] = result.error.issues.map(issue => ({
      type: 'control' as const,
      controlId: typeof control === 'object' && control !== null && 'id' in control ? String(control.id) : undefined,
      field: issue.path.join('.'),
      message: issue.message,
      severity: 'error' as const
    }));

    return {
      isValid: false,
      errors
    };
  }

  // Additional validation against existing controls
  const validatedControl = result.data;
  const additionalErrors: ValidationError[] = [];

  // Check for duplicate ID among existing controls
  if (existingControls.some(existing => existing.id === validatedControl.id)) {
    additionalErrors.push({
      type: 'control',
      controlId: validatedControl.id,
      field: 'id',
      message: `Control ID '${validatedControl.id}' already exists`,
      severity: 'error'
    });
  }

  // Check for duplicate name among existing controls
  if (existingControls.some(existing => existing.name === validatedControl.name)) {
    additionalErrors.push({
      type: 'control',
      controlId: validatedControl.id,
      field: 'name',
      message: `Control name '${validatedControl.name}' already exists`,
      severity: 'error'
    });
  }

  return {
    isValid: additionalErrors.length === 0,
    errors: additionalErrors
  };
}

/**
 * Validates validation rules for logical consistency
 */
export function validateValidationRules(rules: unknown, controlType: ControlType): ValidationResult {
  const result = ValidationRulesSchema.safeParse(rules);
  
  if (!result.success) {
    const errors: ValidationError[] = result.error.issues.map(issue => ({
      type: 'validation' as const,
      field: issue.path.join('.'),
      message: issue.message,
      severity: 'error' as const
    }));

    return {
      isValid: false,
      errors
    };
  }

  const validatedRules = result.data;
  const warnings: ValidationError[] = [];

  // Type-specific validation warnings
  if (controlType === 'checkbox' || controlType === 'button') {
    if (validatedRules.minLength || validatedRules.maxLength || validatedRules.pattern) {
      warnings.push({
        type: 'validation',
        field: 'validation',
        message: `String validation rules are not applicable to ${controlType} controls`,
        severity: 'warning'
      });
    }
  }

  if (controlType !== 'number') {
    if (validatedRules.min !== undefined || validatedRules.max !== undefined) {
      warnings.push({
        type: 'validation',
        field: 'validation',
        message: `Numeric validation rules are only applicable to number controls`,
        severity: 'warning'
      });
    }
  }

  return {
    isValid: true,
    errors: warnings
  };
}

/**
 * Validates that a JSON string represents a valid UI schema
 */
export function validateSchemaJSON(jsonString: string): ValidationResult {
  try {
    const parsed = JSON.parse(jsonString);
    return validateUISchema(parsed);
  } catch (error) {
    return {
      isValid: false,
      errors: [{
        type: 'schema',
        field: 'json',
        message: error instanceof Error ? error.message : 'Invalid JSON format',
        severity: 'error'
      }]
    };
  }
}

/**
 * Checks if a schema has any validation errors
 */
export function hasValidationErrors(errors: ValidationError[]): boolean {
  return errors.some(error => error.severity === 'error');
}

/**
 * Filters validation errors by severity
 */
export function filterErrorsBySeverity(errors: ValidationError[], severity: ValidationError['severity']): ValidationError[] {
  return errors.filter(error => error.severity === severity);
}

/**
 * Groups validation errors by control ID
 */
export function groupErrorsByControl(errors: ValidationError[]): Record<string, ValidationError[]> {
  return errors.reduce((groups, error) => {
    const key = error.controlId || 'schema';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(error);
    return groups;
  }, {} as Record<string, ValidationError[]>);
}