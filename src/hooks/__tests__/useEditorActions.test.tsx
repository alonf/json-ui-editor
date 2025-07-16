import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { EditorProvider } from '../../context/EditorContext';
import { useEditorActions, useEditorState } from '../useEditorActions';
import { UISchema, UIControl, ValidationError } from '../../types/schema';

// Test wrapper component
const createWrapper = (initialSchema?: UISchema) => {
  return ({ children }: { children: ReactNode }) => (
    <EditorProvider initialSchema={initialSchema}>
      {children}
    </EditorProvider>
  );
};

// Sample test data
const sampleControl: UIControl = {
  id: 'test-control-1',
  type: 'text',
  label: 'Test Field',
  name: 'testField',
  required: true
};

const sampleSchema: UISchema = {
  title: 'Test Form',
  description: 'A test form',
  layout: 'vertical',
  controls: [sampleControl]
};

describe('useEditorActions', () => {
  describe('schema actions', () => {
    it('should set schema', () => {
      const { result } = renderHook(() => ({
        actions: useEditorActions(),
        state: useEditorState()
      }), {
        wrapper: createWrapper()
      });

      act(() => {
        result.current.actions.setSchema(sampleSchema);
      });

      expect(result.current.state.schema).toEqual(sampleSchema);
      expect(result.current.state.isDirty).toBe(true);
    });

    it('should update schema metadata', () => {
      const { result } = renderHook(() => ({
        actions: useEditorActions(),
        state: useEditorState()
      }), {
        wrapper: createWrapper(sampleSchema)
      });

      act(() => {
        result.current.actions.updateSchemaMetadata({
          title: 'Updated Title',
          layout: 'horizontal'
        });
      });

      expect(result.current.state.schema.title).toBe('Updated Title');
      expect(result.current.state.schema.layout).toBe('horizontal');
    });
  });

  describe('control actions', () => {
    it('should add control', () => {
      const { result } = renderHook(() => ({
        actions: useEditorActions(),
        state: useEditorState()
      }), {
        wrapper: createWrapper()
      });

      act(() => {
        result.current.actions.addControl('email');
      });

      expect(result.current.state.schema.controls).toHaveLength(1);
      expect(result.current.state.schema.controls[0].type).toBe('email');
      expect(result.current.state.schema.controls[0].label).toBe('Email Field');
      expect(result.current.state.selectedControlId).toBe(result.current.state.schema.controls[0].id);
    });

    it('should add select control with default options', () => {
      const { result } = renderHook(() => ({
        actions: useEditorActions(),
        state: useEditorState()
      }), {
        wrapper: createWrapper()
      });

      act(() => {
        result.current.actions.addControl('select');
      });

      const addedControl = result.current.state.schema.controls[0];
      expect(addedControl.type).toBe('select');
      expect(addedControl.options).toEqual([
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' }
      ]);
    });

    it('should update control', () => {
      const { result } = renderHook(() => ({
        actions: useEditorActions(),
        state: useEditorState()
      }), {
        wrapper: createWrapper(sampleSchema)
      });

      const updatedControl = {
        ...sampleControl,
        label: 'Updated Label',
        required: false
      };

      act(() => {
        result.current.actions.updateControl(sampleControl.id, updatedControl);
      });

      expect(result.current.state.schema.controls[0]).toEqual(updatedControl);
    });

    it('should remove control', () => {
      const { result } = renderHook(() => ({
        actions: useEditorActions(),
        state: useEditorState()
      }), {
        wrapper: createWrapper(sampleSchema)
      });

      act(() => {
        result.current.actions.removeControl(sampleControl.id);
      });

      expect(result.current.state.schema.controls).toHaveLength(0);
    });

    it('should reorder controls', () => {
      const control2: UIControl = {
        id: 'control-2',
        type: 'email',
        label: 'Email',
        name: 'email'
      };

      const schemaWithTwoControls: UISchema = {
        ...sampleSchema,
        controls: [sampleControl, control2]
      };

      const { result } = renderHook(() => ({
        actions: useEditorActions(),
        state: useEditorState()
      }), {
        wrapper: createWrapper(schemaWithTwoControls)
      });

      const reorderedControls = [control2, sampleControl];

      act(() => {
        result.current.actions.reorderControls(reorderedControls);
      });

      expect(result.current.state.schema.controls).toEqual(reorderedControls);
    });
  });

  describe('selection actions', () => {
    it('should select control', () => {
      const { result } = renderHook(() => ({
        actions: useEditorActions(),
        state: useEditorState()
      }), {
        wrapper: createWrapper(sampleSchema)
      });

      act(() => {
        result.current.actions.selectControl(sampleControl.id);
      });

      expect(result.current.state.selectedControlId).toBe(sampleControl.id);
      expect(result.current.state.selectedControl).toEqual(sampleControl);
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => ({
        actions: useEditorActions(),
        state: useEditorState()
      }), {
        wrapper: createWrapper(sampleSchema)
      });

      // First select a control
      act(() => {
        result.current.actions.selectControl(sampleControl.id);
      });

      // Then clear selection
      act(() => {
        result.current.actions.selectControl(null);
      });

      expect(result.current.state.selectedControlId).toBeNull();
      expect(result.current.state.selectedControl).toBeNull();
    });
  });

  describe('mode actions', () => {
    it('should set mode', () => {
      const { result } = renderHook(() => ({
        actions: useEditorActions(),
        state: useEditorState()
      }), {
        wrapper: createWrapper()
      });

      act(() => {
        result.current.actions.setMode('json');
      });

      expect(result.current.state.mode).toBe('json');
      expect(result.current.state.isJsonMode).toBe(true);
      expect(result.current.state.isVisualMode).toBe(false);
    });
  });

  describe('error actions', () => {
    it('should set errors', () => {
      const { result } = renderHook(() => ({
        actions: useEditorActions(),
        state: useEditorState()
      }), {
        wrapper: createWrapper()
      });

      const errors: ValidationError[] = [
        {
          type: 'control',
          controlId: 'test-id',
          field: 'name',
          message: 'Name is required',
          severity: 'error'
        }
      ];

      act(() => {
        result.current.actions.setErrors(errors);
      });

      expect(result.current.state.errors).toEqual(errors);
      expect(result.current.state.hasErrors).toBe(true);
    });

    it('should clear errors', () => {
      const { result } = renderHook(() => ({
        actions: useEditorActions(),
        state: useEditorState()
      }), {
        wrapper: createWrapper()
      });

      // First set some errors
      const errors: ValidationError[] = [
        {
          type: 'control',
          message: 'Test error',
          severity: 'error'
        }
      ];

      act(() => {
        result.current.actions.setErrors(errors);
      });

      // Then clear them
      act(() => {
        result.current.actions.clearErrors();
      });

      expect(result.current.state.errors).toEqual([]);
      expect(result.current.state.hasErrors).toBe(false);
    });
  });

  describe('dirty state actions', () => {
    it('should set dirty state', () => {
      const { result } = renderHook(() => ({
        actions: useEditorActions(),
        state: useEditorState()
      }), {
        wrapper: createWrapper()
      });

      act(() => {
        result.current.actions.setDirty(true);
      });

      expect(result.current.state.isDirty).toBe(true);
    });
  });

  describe('history actions', () => {
    it('should handle undo/redo', () => {
      const { result } = renderHook(() => ({
        actions: useEditorActions(),
        state: useEditorState()
      }), {
        wrapper: createWrapper()
      });

      // Add a control (creates history)
      act(() => {
        result.current.actions.addControl('text');
      });

      expect(result.current.state.canUndo).toBe(true);
      expect(result.current.state.canRedo).toBe(false);
      expect(result.current.state.controlCount).toBe(1);

      // Undo
      act(() => {
        result.current.actions.undo();
      });

      expect(result.current.state.canUndo).toBe(false);
      expect(result.current.state.canRedo).toBe(true);
      expect(result.current.state.controlCount).toBe(0);

      // Redo
      act(() => {
        result.current.actions.redo();
      });

      expect(result.current.state.canUndo).toBe(true);
      expect(result.current.state.canRedo).toBe(false);
      expect(result.current.state.controlCount).toBe(1);
    });

    it('should clear history', () => {
      const { result } = renderHook(() => ({
        actions: useEditorActions(),
        state: useEditorState()
      }), {
        wrapper: createWrapper()
      });

      // Add a control to create history
      act(() => {
        result.current.actions.addControl('text');
      });

      expect(result.current.state.canUndo).toBe(true);

      // Clear history
      act(() => {
        result.current.actions.clearHistory();
      });

      expect(result.current.state.canUndo).toBe(false);
      expect(result.current.state.canRedo).toBe(false);
    });
  });
});

describe('useEditorState', () => {
  it('should provide computed values', () => {
    const { result } = renderHook(() => useEditorState(), {
      wrapper: createWrapper(sampleSchema)
    });

    expect(result.current.schema).toEqual(sampleSchema);
    expect(result.current.controlCount).toBe(1);
    expect(result.current.hasErrors).toBe(false);
    expect(result.current.isVisualMode).toBe(true);
    expect(result.current.isJsonMode).toBe(false);
    expect(result.current.selectedControl).toBeNull();
  });

  it('should provide selected control when control is selected', () => {
    const { result } = renderHook(() => ({
      actions: useEditorActions(),
      state: useEditorState()
    }), {
      wrapper: createWrapper(sampleSchema)
    });

    act(() => {
      result.current.actions.selectControl(sampleControl.id);
    });

    expect(result.current.state.selectedControl).toEqual(sampleControl);
    expect(result.current.state.selectedControlId).toBe(sampleControl.id);
  });
});