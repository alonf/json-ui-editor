import { describe, it, expect } from 'vitest';
import {
  validateUISchema,
  validateUIControl,
  validateValidationRules,
  validateSchemaJSON,
  hasValidationErrors,
  filterErrorsBySeverity,
  groupErrorsByControl,
  UISchemaSchema,
  UIControlSchema,
  ValidationRulesSchema
} from '../schemaValidator';
import { UISchema, UIControl, ValidationRules } from '../../types/schema';

describe('Schema Validation', () => {
  describe('UISchemaSchema', () => {
    it('should validate a complete valid schema', () => {
      const validSchema: UISchema = {
        title: 'Test Form',
        description: 'A test form',
        layout: 'vertical',
        controls: [
          {
            id: 'ctrl1',
            type: 'text',
            label: 'Name',
            name: 'name',
            required: true
          }
        ]
      };

      const result = UISchemaSchema.safeParse(validSchema);
      expect(result.success).toBe(true);
    });

    it('should reject schema with duplicate control IDs', () => {
      const invalidSchema = {
        layout: 'vertical',
        controls: [
          { id: 'ctrl1', type: 'text', label: 'Name', name: 'name' },
          { id: 'ctrl1', type: 'email', label: 'Email', name: 'email' }
        ]
      };

      const result = UISchemaSchema.safeParse(invalidSchema);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Control IDs must be unique');
      }
    });

    it('should reject schema with duplicate control names', () => {
      const invalidSchema = {
        layout: 'vertical',
        controls: [
          { id: 'ctrl1', type: 'text', label: 'Name', name: 'name' },
          { id: 'ctrl2', type: 'email', label: 'Email', name: 'name' }
        ]
      };

      const result = UISchemaSchema.safeParse(invalidSchema);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Control names must be unique');
      }
    });

    it('should reject schema with invalid layout', () => {
      const invalidSchema = {
        layout: 'invalid',
        controls: []
      };

      const result = UISchemaSchema.safeParse(invalidSchema);
      expect(result.success).toBe(false);
    });
  });

  describe('UIControlSchema', () => {
    it('should validate a basic text control', () => {
      const validControl: UIControl = {
        id: 'ctrl1',
        type: 'text',
        label: 'Name',
        name: 'name'
      };

      const result = UIControlSchema.safeParse(validControl);
      expect(result.success).toBe(true);
    });

    it('should reject control with empty ID', () => {
      const invalidControl = {
        id: '',
        type: 'text',
        label: 'Name',
        name: 'name'
      };

      const result = UIControlSchema.safeParse(invalidControl);
      expect(result.success).toBe(false);
    });

    it('should reject control with invalid name format', () => {
      const invalidControl = {
        id: 'ctrl1',
        type: 'text',
        label: 'Name',
        name: '123invalid'
      };

      const result = UIControlSchema.safeParse(invalidControl);
      expect(result.success).toBe(false);
    });

    it('should require options for select controls', () => {
      const invalidSelect = {
        id: 'ctrl1',
        type: 'select',
        label: 'Choose',
        name: 'choice'
      };

      const result = UIControlSchema.safeParse(invalidSelect);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Select controls must have at least one option');
      }
    });

    it('should validate select control with options', () => {
      const validSelect = {
        id: 'ctrl1',
        type: 'select',
        label: 'Choose',
        name: 'choice',
        options: [
          { label: 'Option 1', value: 'opt1' },
          { label: 'Option 2', value: 'opt2' }
        ]
      };

      const result = UIControlSchema.safeParse(validSelect);
      expect(result.success).toBe(true);
    });

    it('should reject non-select controls with options', () => {
      const invalidControl = {
        id: 'ctrl1',
        type: 'text',
        label: 'Name',
        name: 'name',
        options: [{ label: 'Option', value: 'opt' }]
      };

      const result = UIControlSchema.safeParse(invalidControl);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Only select controls can have options');
      }
    });
  });

  describe('ValidationRulesSchema', () => {
    it('should validate basic validation rules', () => {
      const validRules: ValidationRules = {
        minLength: 2,
        maxLength: 50,
        required: true
      };

      const result = ValidationRulesSchema.safeParse(validRules);
      expect(result.success).toBe(true);
    });

    it('should reject when minLength > maxLength', () => {
      const invalidRules = {
        minLength: 10,
        maxLength: 5
      };

      const result = ValidationRulesSchema.safeParse(invalidRules);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('minLength must be less than or equal to maxLength');
      }
    });

    it('should reject when min > max', () => {
      const invalidRules = {
        min: 100,
        max: 50
      };

      const result = ValidationRulesSchema.safeParse(invalidRules);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('min must be less than or equal to max');
      }
    });

    it('should accept equal min/max values', () => {
      const validRules = {
        min: 50,
        max: 50
      };

      const result = ValidationRulesSchema.safeParse(validRules);
      expect(result.success).toBe(true);
    });
  });
});describe(
'Validation Utility Functions', () => {
  describe('validateUISchema', () => {
    it('should return valid result for correct schema', () => {
      const validSchema: UISchema = {
        layout: 'vertical',
        controls: [
          {
            id: 'ctrl1',
            type: 'text',
            label: 'Name',
            name: 'name'
          }
        ]
      };

      const result = validateUISchema(validSchema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid schema', () => {
      const invalidSchema = {
        layout: 'invalid',
        controls: []
      };

      const result = validateUISchema(invalidSchema);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('schema');
      expect(result.errors[0].severity).toBe('error');
    });

    it('should handle completely invalid input', () => {
      const result = validateUISchema(null);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateUIControl', () => {
    it('should validate a single control', () => {
      const validControl: UIControl = {
        id: 'ctrl1',
        type: 'text',
        label: 'Name',
        name: 'name'
      };

      const result = validateUIControl(validControl);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect duplicate ID in existing controls', () => {
      const newControl: UIControl = {
        id: 'ctrl1',
        type: 'email',
        label: 'Email',
        name: 'email'
      };

      const existingControls: UIControl[] = [
        {
          id: 'ctrl1',
          type: 'text',
          label: 'Name',
          name: 'name'
        }
      ];

      const result = validateUIControl(newControl, existingControls);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('already exists');
      expect(result.errors[0].field).toBe('id');
    });

    it('should detect duplicate name in existing controls', () => {
      const newControl: UIControl = {
        id: 'ctrl2',
        type: 'email',
        label: 'Email',
        name: 'name'
      };

      const existingControls: UIControl[] = [
        {
          id: 'ctrl1',
          type: 'text',
          label: 'Name',
          name: 'name'
        }
      ];

      const result = validateUIControl(newControl, existingControls);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('already exists');
      expect(result.errors[0].field).toBe('name');
    });

    it('should handle invalid control structure', () => {
      const invalidControl = {
        id: '',
        type: 'invalid',
        label: '',
        name: ''
      };

      const result = validateUIControl(invalidControl);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('control');
    });
  });

  describe('validateValidationRules', () => {
    it('should validate appropriate rules for text controls', () => {
      const rules: ValidationRules = {
        minLength: 2,
        maxLength: 50,
        pattern: '^[a-zA-Z]+$'
      };

      const result = validateValidationRules(rules, 'text');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate appropriate rules for number controls', () => {
      const rules: ValidationRules = {
        min: 0,
        max: 100
      };

      const result = validateValidationRules(rules, 'number');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about inappropriate string rules for checkbox', () => {
      const rules: ValidationRules = {
        minLength: 2,
        maxLength: 50
      };

      const result = validateValidationRules(rules, 'checkbox');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].severity).toBe('warning');
      expect(result.errors[0].message).toContain('not applicable to checkbox');
    });

    it('should warn about inappropriate numeric rules for text', () => {
      const rules: ValidationRules = {
        min: 0,
        max: 100
      };

      const result = validateValidationRules(rules, 'text');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].severity).toBe('warning');
      expect(result.errors[0].message).toContain('only applicable to number controls');
    });

    it('should handle invalid validation rules', () => {
      const invalidRules = {
        minLength: -1,
        maxLength: 'invalid'
      };

      const result = validateValidationRules(invalidRules, 'text');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('validation');
    });
  });

  describe('validateSchemaJSON', () => {
    it('should validate valid JSON schema string', () => {
      const validJSON = JSON.stringify({
        layout: 'vertical',
        controls: [
          {
            id: 'ctrl1',
            type: 'text',
            label: 'Name',
            name: 'name'
          }
        ]
      });

      const result = validateSchemaJSON(validJSON);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid JSON string', () => {
      const invalidJSON = '{ invalid json }';

      const result = validateSchemaJSON(invalidJSON);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('schema');
      expect(result.errors[0].field).toBe('json');
    });

    it('should reject valid JSON with invalid schema', () => {
      const invalidSchemaJSON = JSON.stringify({
        layout: 'invalid',
        controls: []
      });

      const result = validateSchemaJSON(invalidSchemaJSON);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('schema');
    });
  });

  describe('Utility Functions', () => {
    describe('hasValidationErrors', () => {
      it('should return true when errors exist', () => {
        const errors = [
          {
            type: 'schema' as const,
            field: 'test',
            message: 'Error',
            severity: 'error' as const
          }
        ];

        expect(hasValidationErrors(errors)).toBe(true);
      });

      it('should return false when only warnings exist', () => {
        const warnings = [
          {
            type: 'validation' as const,
            field: 'test',
            message: 'Warning',
            severity: 'warning' as const
          }
        ];

        expect(hasValidationErrors(warnings)).toBe(false);
      });

      it('should return false for empty array', () => {
        expect(hasValidationErrors([])).toBe(false);
      });
    });

    describe('filterErrorsBySeverity', () => {
      it('should filter errors by severity', () => {
        const mixed = [
          {
            type: 'schema' as const,
            field: 'test1',
            message: 'Error',
            severity: 'error' as const
          },
          {
            type: 'validation' as const,
            field: 'test2',
            message: 'Warning',
            severity: 'warning' as const
          },
          {
            type: 'schema' as const,
            field: 'test3',
            message: 'Info',
            severity: 'info' as const
          }
        ];

        const errors = filterErrorsBySeverity(mixed, 'error');
        const warnings = filterErrorsBySeverity(mixed, 'warning');
        const info = filterErrorsBySeverity(mixed, 'info');

        expect(errors).toHaveLength(1);
        expect(warnings).toHaveLength(1);
        expect(info).toHaveLength(1);
        expect(errors[0].severity).toBe('error');
        expect(warnings[0].severity).toBe('warning');
        expect(info[0].severity).toBe('info');
      });
    });

    describe('groupErrorsByControl', () => {
      it('should group errors by control ID', () => {
        const errors = [
          {
            type: 'control' as const,
            controlId: 'ctrl1',
            field: 'name',
            message: 'Error 1',
            severity: 'error' as const
          },
          {
            type: 'control' as const,
            controlId: 'ctrl1',
            field: 'type',
            message: 'Error 2',
            severity: 'error' as const
          },
          {
            type: 'control' as const,
            controlId: 'ctrl2',
            field: 'label',
            message: 'Error 3',
            severity: 'error' as const
          },
          {
            type: 'schema' as const,
            field: 'layout',
            message: 'Schema Error',
            severity: 'error' as const
          }
        ];

        const grouped = groupErrorsByControl(errors);

        expect(grouped['ctrl1']).toHaveLength(2);
        expect(grouped['ctrl2']).toHaveLength(1);
        expect(grouped['schema']).toHaveLength(1);
      });

      it('should handle empty errors array', () => {
        const grouped = groupErrorsByControl([]);
        expect(Object.keys(grouped)).toHaveLength(0);
      });
    });
  });
});