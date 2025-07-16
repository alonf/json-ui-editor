import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HTMLRenderer } from '../HTMLRenderer';
import { UISchema, UIControl } from '../../types/schema';

describe('HTMLRenderer', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  describe('Empty State', () => {
    it('should render empty state when no controls are provided', () => {
      const schema: UISchema = {
        layout: 'vertical',
        controls: []
      };

      render(<HTMLRenderer schema={schema} />);
      
      expect(screen.getByText('No form controls defined. Add controls to see the preview.')).toBeInTheDocument();
      expect(screen.getByText('No form controls defined. Add controls to see the preview.').closest('.html-renderer')).toHaveClass('html-renderer', 'empty-state');
    });

    it('should render empty state when controls array is undefined', () => {
      const schema = {
        layout: 'vertical' as const,
        controls: undefined as any
      };

      render(<HTMLRenderer schema={schema} />);
      
      expect(screen.getByText('No form controls defined. Add controls to see the preview.')).toBeInTheDocument();
    });
  });

  describe('Form Structure', () => {
    it('should render form with title and description', () => {
      const schema: UISchema = {
        title: 'Test Form',
        description: 'This is a test form',
        layout: 'vertical',
        controls: [
          {
            id: 'test1',
            type: 'text',
            label: 'Test Input',
            name: 'testInput'
          }
        ]
      };

      render(<HTMLRenderer schema={schema} />);
      
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Test Form');
      expect(screen.getByText('This is a test form')).toBeInTheDocument();
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('should apply correct layout classes', () => {
      const verticalSchema: UISchema = {
        layout: 'vertical',
        controls: [{ id: '1', type: 'text', label: 'Test', name: 'test' }]
      };

      const { rerender } = render(<HTMLRenderer schema={verticalSchema} />);
      expect(screen.getByRole('form')).toHaveClass('form-layout-vertical');

      const horizontalSchema: UISchema = {
        layout: 'horizontal',
        controls: [{ id: '1', type: 'text', label: 'Test', name: 'test' }]
      };

      rerender(<HTMLRenderer schema={horizontalSchema} />);
      expect(screen.getByRole('form')).toHaveClass('form-layout-horizontal');

      const gridSchema: UISchema = {
        layout: 'grid',
        controls: [{ id: '1', type: 'text', label: 'Test', name: 'test' }]
      };

      rerender(<HTMLRenderer schema={gridSchema} />);
      expect(screen.getByRole('form')).toHaveClass('form-layout-grid');
    });

    it('should apply custom className', () => {
      const schema: UISchema = {
        layout: 'vertical',
        controls: [{ id: '1', type: 'text', label: 'Test', name: 'test' }]
      };

      render(<HTMLRenderer schema={schema} className="custom-class" />);
      
      expect(screen.getByText('Test').closest('.html-renderer')).toHaveClass('html-renderer', 'custom-class');
    });
  });

  describe('Text Input Controls', () => {
    it('should render text input with all attributes', () => {
      const control: UIControl = {
        id: 'text1',
        type: 'text',
        label: 'Full Name',
        name: 'fullName',
        placeholder: 'Enter your full name',
        required: true,
        className: 'custom-input',
        validation: {
          minLength: 2,
          maxLength: 50,
          pattern: '[A-Za-z ]+',
          customMessage: 'Please enter a valid name'
        }
      };

      const schema: UISchema = {
        layout: 'vertical',
        controls: [control]
      };

      render(<HTMLRenderer schema={schema} />);
      
      const input = screen.getByRole('textbox', { name: /full name/i });
      const label = screen.getByText('Full Name');
      
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('id', 'text1');
      expect(input).toHaveAttribute('name', 'fullName');
      expect(input).toHaveAttribute('placeholder', 'Enter your full name');
      expect(input).toHaveAttribute('aria-label', 'Full Name');
      expect(input).toHaveAttribute('class', 'custom-input');
      expect(input).toBeRequired();
      expect(input).toHaveAttribute('minlength', '2');
      expect(input).toHaveAttribute('maxlength', '50');
      expect(input).toHaveAttribute('pattern', '[A-Za-z ]+');
      expect(input).toHaveAttribute('title', 'Please enter a valid name');
      
      expect(label).toHaveAttribute('for', 'text1');
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render email input', () => {
      const schema: UISchema = {
        layout: 'vertical',
        controls: [{
          id: 'email1',
          type: 'email',
          label: 'Email Address',
          name: 'email'
        }]
      };

      render(<HTMLRenderer schema={schema} />);
      
      const input = screen.getByRole('textbox', { name: /email address/i });
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render password input', () => {
      const schema: UISchema = {
        layout: 'vertical',
        controls: [{
          id: 'pwd1',
          type: 'password',
          label: 'Password',
          name: 'password'
        }]
      };

      render(<HTMLRenderer schema={schema} />);
      
      const input = screen.getByLabelText(/password/i);
      expect(input).toHaveAttribute('type', 'password');
    });
  });

  describe('Textarea Control', () => {
    it('should render textarea with validation attributes', () => {
      const schema: UISchema = {
        layout: 'vertical',
        controls: [{
          id: 'desc1',
          type: 'textarea',
          label: 'Description',
          name: 'description',
          placeholder: 'Enter description',
          required: true,
          validation: {
            minLength: 10,
            maxLength: 500
          }
        }]
      };

      render(<HTMLRenderer schema={schema} />);
      
      const textarea = screen.getByRole('textbox', { name: /description/i });
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(textarea).toHaveAttribute('placeholder', 'Enter description');
      expect(textarea).toBeRequired();
      expect(textarea).toHaveAttribute('minlength', '10');
      expect(textarea).toHaveAttribute('maxlength', '500');
    });
  });

  describe('Number Input Control', () => {
    it('should render number input with numeric validation', () => {
      const schema: UISchema = {
        layout: 'vertical',
        controls: [{
          id: 'age1',
          type: 'number',
          label: 'Age',
          name: 'age',
          required: true,
          validation: {
            min: 18,
            max: 100
          }
        }]
      };

      render(<HTMLRenderer schema={schema} />);
      
      const input = screen.getByRole('spinbutton', { name: /age/i });
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toBeRequired();
      expect(input).toHaveAttribute('min', '18');
      expect(input).toHaveAttribute('max', '100');
    });
  });

  describe('Select Control', () => {
    it('should render select with options', () => {
      const schema: UISchema = {
        layout: 'vertical',
        controls: [{
          id: 'country1',
          type: 'select',
          label: 'Country',
          name: 'country',
          required: true,
          options: [
            { label: 'United States', value: 'us' },
            { label: 'Canada', value: 'ca' },
            { label: 'United Kingdom', value: 'uk' }
          ]
        }]
      };

      render(<HTMLRenderer schema={schema} />);
      
      const select = screen.getByRole('combobox', { name: /country/i });
      expect(select).toBeRequired();
      
      // Should not have default empty option for required select
      expect(screen.queryByText('-- Select an option --')).not.toBeInTheDocument();
      
      expect(screen.getByRole('option', { name: 'United States' })).toHaveValue('us');
      expect(screen.getByRole('option', { name: 'Canada' })).toHaveValue('ca');
      expect(screen.getByRole('option', { name: 'United Kingdom' })).toHaveValue('uk');
    });

    it('should render select with default option when not required', () => {
      const schema: UISchema = {
        layout: 'vertical',
        controls: [{
          id: 'optional1',
          type: 'select',
          label: 'Optional Select',
          name: 'optional',
          required: false,
          options: [
            { label: 'Option 1', value: 'opt1' }
          ]
        }]
      };

      render(<HTMLRenderer schema={schema} />);
      
      expect(screen.getByText('-- Select an option --')).toBeInTheDocument();
    });
  });

  describe('Checkbox Control', () => {
    it('should render checkbox with proper structure', () => {
      const schema: UISchema = {
        layout: 'vertical',
        controls: [{
          id: 'agree1',
          type: 'checkbox',
          label: 'I agree to the terms',
          name: 'agree',
          required: true
        }]
      };

      render(<HTMLRenderer schema={schema} />);
      
      const checkbox = screen.getByRole('checkbox', { name: /i agree to the terms/i });
      expect(checkbox).toHaveAttribute('type', 'checkbox');
      expect(checkbox).toBeRequired();
      
      const label = screen.getByText('I agree to the terms');
      expect(label.closest('label')).toHaveClass('checkbox-label');
      expect(screen.getByText('*')).toBeInTheDocument();
    });
  });

  describe('Button Control', () => {
    it('should render button with correct type', () => {
      const schema: UISchema = {
        layout: 'vertical',
        controls: [
          {
            id: 'submit1',
            type: 'button',
            label: 'Submit Form',
            name: 'submit',
            className: 'primary-button'
          },
          {
            id: 'cancel1',
            type: 'button',
            label: 'Cancel',
            name: 'cancel'
          }
        ]
      };

      render(<HTMLRenderer schema={schema} />);
      
      const submitButton = screen.getByRole('button', { name: 'Submit Form' });
      expect(submitButton).toHaveAttribute('type', 'submit');
      expect(submitButton).toHaveClass('form-button', 'primary-button');
      
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Form Submission', () => {
    it('should handle form submission with correct data types', () => {
      const schema: UISchema = {
        layout: 'vertical',
        controls: [
          {
            id: 'name1',
            type: 'text',
            label: 'Name',
            name: 'name'
          },
          {
            id: 'age1',
            type: 'number',
            label: 'Age',
            name: 'age'
          },
          {
            id: 'agree1',
            type: 'checkbox',
            label: 'Agree',
            name: 'agree'
          },
          {
            id: 'submit1',
            type: 'button',
            label: 'Submit',
            name: 'submit'
          }
        ]
      };

      render(<HTMLRenderer schema={schema} onSubmit={mockOnSubmit} />);
      
      // Fill out form
      fireEvent.change(screen.getByRole('textbox', { name: /name/i }), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByRole('spinbutton', { name: /age/i }), {
        target: { value: '25' }
      });
      fireEvent.click(screen.getByRole('checkbox', { name: /agree/i }));
      
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        age: 25,
        agree: true
      });
    });

    it('should handle empty form submission', () => {
      const schema: UISchema = {
        layout: 'vertical',
        controls: [
          {
            id: 'optional1',
            type: 'text',
            label: 'Optional',
            name: 'optional'
          },
          {
            id: 'submit1',
            type: 'button',
            label: 'Submit',
            name: 'submit'
          }
        ]
      };

      render(<HTMLRenderer schema={schema} onSubmit={mockOnSubmit} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        optional: undefined
      });
    });

    it('should prevent default form submission', () => {
      const mockOnSubmit = vi.fn();
      const schema: UISchema = {
        layout: 'vertical',
        controls: [
          {
            id: 'submit1',
            type: 'button',
            label: 'Submit',
            name: 'submit'
          }
        ]
      };

      render(<HTMLRenderer schema={schema} onSubmit={mockOnSubmit} />);
      
      const form = screen.getByRole('form');
      
      // Test that the form has noValidate attribute (which indicates we're handling submission ourselves)
      expect(form).toHaveAttribute('novalidate');
      
      // Test that our onSubmit handler is called when form is submitted
      fireEvent.submit(form);
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  describe('Validation Attributes Mapping', () => {
    it('should map all validation rules to HTML attributes', () => {
      const schema: UISchema = {
        layout: 'vertical',
        controls: [{
          id: 'test1',
          type: 'text',
          label: 'Test',
          name: 'test',
          validation: {
            minLength: 5,
            maxLength: 20,
            pattern: '[A-Za-z]+',
            customMessage: 'Custom validation message'
          }
        }]
      };

      render(<HTMLRenderer schema={schema} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('minlength', '5');
      expect(input).toHaveAttribute('maxlength', '20');
      expect(input).toHaveAttribute('pattern', '[A-Za-z]+');
      expect(input).toHaveAttribute('title', 'Custom validation message');
    });

    it('should map numeric validation rules', () => {
      const schema: UISchema = {
        layout: 'vertical',
        controls: [{
          id: 'num1',
          type: 'number',
          label: 'Number',
          name: 'number',
          validation: {
            min: 10,
            max: 100
          }
        }]
      };

      render(<HTMLRenderer schema={schema} />);
      
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('min', '10');
      expect(input).toHaveAttribute('max', '100');
    });

    it('should handle missing validation rules', () => {
      const schema: UISchema = {
        layout: 'vertical',
        controls: [{
          id: 'simple1',
          type: 'text',
          label: 'Simple',
          name: 'simple'
        }]
      };

      render(<HTMLRenderer schema={schema} />);
      
      const input = screen.getByRole('textbox');
      expect(input).not.toHaveAttribute('minlength');
      expect(input).not.toHaveAttribute('maxlength');
      expect(input).not.toHaveAttribute('pattern');
      expect(input).not.toHaveAttribute('title');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      const schema: UISchema = {
        layout: 'vertical',
        controls: [
          {
            id: 'name1',
            type: 'text',
            label: 'Full Name',
            name: 'name',
            required: true
          }
        ]
      };

      render(<HTMLRenderer schema={schema} />);
      
      const input = screen.getByRole('textbox', { name: /full name/i });
      expect(input).toHaveAttribute('aria-label', 'Full Name');
      
      const requiredIndicator = screen.getByText('*');
      expect(requiredIndicator).toHaveAttribute('aria-label', 'required');
    });

    it('should associate labels with form controls', () => {
      const schema: UISchema = {
        layout: 'vertical',
        controls: [
          {
            id: 'email1',
            type: 'email',
            label: 'Email Address',
            name: 'email'
          }
        ]
      };

      render(<HTMLRenderer schema={schema} />);
      
      const label = screen.getByText('Email Address');
      const input = screen.getByRole('textbox');
      
      expect(label).toHaveAttribute('for', 'email1');
      expect(input).toHaveAttribute('id', 'email1');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown control types gracefully', () => {
      const schema = {
        layout: 'vertical' as const,
        controls: [{
          id: 'unknown1',
          type: 'unknown' as any,
          label: 'Unknown',
          name: 'unknown'
        }]
      };

      render(<HTMLRenderer schema={schema} />);
      
      // Should not render anything for unknown control type
      expect(screen.queryByText('Unknown')).not.toBeInTheDocument();
    });

    it('should handle select without options', () => {
      const schema: UISchema = {
        layout: 'vertical',
        controls: [{
          id: 'select1',
          type: 'select',
          label: 'Empty Select',
          name: 'empty'
        }]
      };

      render(<HTMLRenderer schema={schema} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      // Should only have the default option
      expect(screen.getByText('-- Select an option --')).toBeInTheDocument();
    });
  });
});