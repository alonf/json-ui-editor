import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { vi } from 'vitest';
import { EditorProvider, useEditor, editorReducer, EditorAction } from '../EditorContext';
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

describe('EditorContext', () => {
  describe('useEditor hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test since we expect an error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useEditor());
      }).toThrow('useEditor must be used within an EditorProvider');
      
      consoleSpy.mockRestore();
    });

    it('should provide initial state', () => {
      const { result } = renderHook(() => useEditor(), {
        wrapper: createWrapper()
      });

      expect(result.current.state.present.schema.title).toBe('New Form');
      expect(result.current.state.present.selectedControlId).toBeNull();
      expect(result.current.state.present.mode).toBe('visual');
      expect(result.current.state.present.errors).toEqual([]);
      expect(result.current.state.present.isDirty).toBe(false);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });

    it('should accept initial schema', () => {
      const { result } = renderHook(() => useEditor(), {
        wrapper: createWrapper(sampleSchema)
      });

      expect(result.current.state.present.schema).toEqual(sampleSchema);
    });
  });

  describe('editorReducer', () => {
    const initialState = {
      present: {
        schema: sampleSchema,
        selectedControlId: null,
        mode: 'visual' as const,
        errors: [],
        isDirty: false
      },
      past: [],
      future: []
    };

    describe('SET_SCHEMA action', () => {
      it('should update schema and mark as dirty', () => {
        const newSchema: UISchema = {
          title: 'Updated Form',
          description: 'Updated description',
          layout: 'horizontal',
          controls: []
        };

        const action: EditorAction = { type: 'SET_SCHEMA', payload: newSchema };
        const result = editorReducer(initialState, action);

        expect(result.present.schema).toEqual(newSchema);
        expect(result.present.isDirty).toBe(true);
        expect(result.past).toHaveLength(1);
        expect(result.past[0]).toEqual(initialState.present);
        expect(result.future).toEqual([]);
      });
    });

    describe('ADD_CONTROL action', () => {
      it('should add control and select it', () => {
        const newControl: UIControl = {
          id: 'new-control',
          type: 'email',
          label: 'Email Field',
          name: 'email',
          required: false
        };

        const action: EditorAction = { type: 'ADD_CONTROL', payload: newControl };
        const result = editorReducer(initialState, action);

        expect(result.present.schema.controls).toHaveLength(2);
        expect(result.present.schema.controls[1]).toEqual(newControl);
        expect(result.present.selectedControlId).toBe(newControl.id);
        expect(result.present.isDirty).toBe(true);
      });
    });

    describe('UPDATE_CONTROL action', () => {
      it('should update existing control', () => {
        const updatedControl: UIControl = {
          ...sampleControl,
          label: 'Updated Label',
          required: false
        };

        const action: EditorAction = {
          type: 'UPDATE_CONTROL',
          payload: { controlId: sampleControl.id, control: updatedControl }
        };
        const result = editorReducer(initialState, action);

        expect(result.present.schema.controls[0]).toEqual(updatedControl);
        expect(result.present.isDirty).toBe(true);
      });

      it('should not update non-existent control', () => {
        const updatedControl: UIControl = {
          id: 'non-existent',
          type: 'text',
          label: 'Non-existent',
          name: 'nonExistent'
        };

        const action: EditorAction = {
          type: 'UPDATE_CONTROL',
          payload: { controlId: 'non-existent', control: updatedControl }
        };
        const result = editorReducer(initialState, action);

        expect(result.present.schema.controls).toEqual(initialState.present.schema.controls);
      });
    });

    describe('REMOVE_CONTROL action', () => {
      it('should remove control', () => {
        const action: EditorAction = { type: 'REMOVE_CONTROL', payload: sampleControl.id };
        const result = editorReducer(initialState, action);

        expect(result.present.schema.controls).toHaveLength(0);
        expect(result.present.isDirty).toBe(true);
      });

      it('should clear selection if removed control was selected', () => {
        const stateWithSelection = {
          ...initialState,
          present: {
            ...initialState.present,
            selectedControlId: sampleControl.id
          }
        };

        const action: EditorAction = { type: 'REMOVE_CONTROL', payload: sampleControl.id };
        const result = editorReducer(stateWithSelection, action);

        expect(result.present.selectedControlId).toBeNull();
      });

      it('should preserve selection if different control was removed', () => {
        const stateWithSelection = {
          ...initialState,
          present: {
            ...initialState.present,
            selectedControlId: 'other-control'
          }
        };

        const action: EditorAction = { type: 'REMOVE_CONTROL', payload: sampleControl.id };
        const result = editorReducer(stateWithSelection, action);

        expect(result.present.selectedControlId).toBe('other-control');
      });
    });

    describe('REORDER_CONTROLS action', () => {
      it('should reorder controls', () => {
        const control2: UIControl = {
          id: 'control-2',
          type: 'email',
          label: 'Email',
          name: 'email'
        };

        const stateWithTwoControls = {
          ...initialState,
          present: {
            ...initialState.present,
            schema: {
              ...initialState.present.schema,
              controls: [sampleControl, control2]
            }
          }
        };

        const reorderedControls = [control2, sampleControl];
        const action: EditorAction = { type: 'REORDER_CONTROLS', payload: reorderedControls };
        const result = editorReducer(stateWithTwoControls, action);

        expect(result.present.schema.controls).toEqual(reorderedControls);
        expect(result.present.isDirty).toBe(true);
      });
    });

    describe('SELECT_CONTROL action', () => {
      it('should select control', () => {
        const action: EditorAction = { type: 'SELECT_CONTROL', payload: sampleControl.id };
        const result = editorReducer(initialState, action);

        expect(result.present.selectedControlId).toBe(sampleControl.id);
        expect(result.past).toEqual(initialState.past); // Should not create history entry
      });

      it('should clear selection', () => {
        const stateWithSelection = {
          ...initialState,
          present: {
            ...initialState.present,
            selectedControlId: sampleControl.id
          }
        };

        const action: EditorAction = { type: 'SELECT_CONTROL', payload: null };
        const result = editorReducer(stateWithSelection, action);

        expect(result.present.selectedControlId).toBeNull();
      });
    });

    describe('SET_MODE action', () => {
      it('should change mode', () => {
        const action: EditorAction = { type: 'SET_MODE', payload: 'json' };
        const result = editorReducer(initialState, action);

        expect(result.present.mode).toBe('json');
        expect(result.past).toEqual(initialState.past); // Should not create history entry
      });
    });

    describe('SET_ERRORS action', () => {
      it('should set validation errors', () => {
        const errors: ValidationError[] = [
          {
            type: 'control',
            controlId: sampleControl.id,
            field: 'name',
            message: 'Name is required',
            severity: 'error'
          }
        ];

        const action: EditorAction = { type: 'SET_ERRORS', payload: errors };
        const result = editorReducer(initialState, action);

        expect(result.present.errors).toEqual(errors);
        expect(result.past).toEqual(initialState.past); // Should not create history entry
      });
    });

    describe('SET_DIRTY action', () => {
      it('should set dirty state', () => {
        const action: EditorAction = { type: 'SET_DIRTY', payload: true };
        const result = editorReducer(initialState, action);

        expect(result.present.isDirty).toBe(true);
        expect(result.past).toEqual(initialState.past); // Should not create history entry
      });
    });

    describe('UNDO action', () => {
      it('should undo when history exists', () => {
        const pastState = {
          schema: { ...sampleSchema, title: 'Previous Title' },
          selectedControlId: null,
          mode: 'visual' as const,
          errors: [],
          isDirty: false
        };

        const stateWithHistory = {
          present: initialState.present,
          past: [pastState],
          future: []
        };

        const action: EditorAction = { type: 'UNDO' };
        const result = editorReducer(stateWithHistory, action);

        expect(result.present).toEqual(pastState);
        expect(result.past).toEqual([]);
        expect(result.future).toEqual([initialState.present]);
      });

      it('should not undo when no history exists', () => {
        const action: EditorAction = { type: 'UNDO' };
        const result = editorReducer(initialState, action);

        expect(result).toEqual(initialState);
      });
    });

    describe('REDO action', () => {
      it('should redo when future exists', () => {
        const futureState = {
          schema: { ...sampleSchema, title: 'Future Title' },
          selectedControlId: null,
          mode: 'visual' as const,
          errors: [],
          isDirty: true
        };

        const stateWithFuture = {
          present: initialState.present,
          past: [],
          future: [futureState]
        };

        const action: EditorAction = { type: 'REDO' };
        const result = editorReducer(stateWithFuture, action);

        expect(result.present).toEqual(futureState);
        expect(result.past).toEqual([initialState.present]);
        expect(result.future).toEqual([]);
      });

      it('should not redo when no future exists', () => {
        const action: EditorAction = { type: 'REDO' };
        const result = editorReducer(initialState, action);

        expect(result).toEqual(initialState);
      });
    });

    describe('CLEAR_HISTORY action', () => {
      it('should clear history', () => {
        const stateWithHistory = {
          present: initialState.present,
          past: [initialState.present],
          future: [initialState.present]
        };

        const action: EditorAction = { type: 'CLEAR_HISTORY' };
        const result = editorReducer(stateWithHistory, action);

        expect(result.present).toEqual(initialState.present);
        expect(result.past).toEqual([]);
        expect(result.future).toEqual([]);
      });
    });
  });

  describe('Integration tests', () => {
    it('should handle complex workflow with undo/redo', () => {
      const { result } = renderHook(() => useEditor(), {
        wrapper: createWrapper()
      });

      // Add a control
      act(() => {
        result.current.dispatch({
          type: 'ADD_CONTROL',
          payload: sampleControl
        });
      });

      expect(result.current.state.present.schema.controls).toHaveLength(1);
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);

      // Update the control
      const updatedControl = { ...sampleControl, label: 'Updated Label' };
      act(() => {
        result.current.dispatch({
          type: 'UPDATE_CONTROL',
          payload: { controlId: sampleControl.id, control: updatedControl }
        });
      });

      expect(result.current.state.present.schema.controls[0].label).toBe('Updated Label');
      expect(result.current.state.past).toHaveLength(2);

      // Undo twice
      act(() => {
        result.current.dispatch({ type: 'UNDO' });
      });
      act(() => {
        result.current.dispatch({ type: 'UNDO' });
      });

      expect(result.current.state.present.schema.controls).toHaveLength(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);

      // Redo once
      act(() => {
        result.current.dispatch({ type: 'REDO' });
      });

      expect(result.current.state.present.schema.controls).toHaveLength(1);
      expect(result.current.state.present.schema.controls[0].label).toBe('Test Field');
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);
    });
  });
});