import { useCallback } from 'react';
import { useEditor } from '../context/EditorContext';
import { UISchema, UIControl, ValidationError, ControlType } from '../types/schema';

// Custom hook for editor actions
export const useEditorActions = () => {
  const { dispatch } = useEditor();

  // Schema actions
  const setSchema = useCallback((schema: UISchema) => {
    dispatch({ type: 'SET_SCHEMA', payload: schema });
  }, [dispatch]);

  const updateSchemaMetadata = useCallback((updates: Partial<Pick<UISchema, 'title' | 'description' | 'layout'>>) => {
    // We need access to current schema to merge updates
    // This will be handled by the reducer properly
    dispatch({ type: 'UPDATE_SCHEMA_METADATA', payload: updates });
  }, [dispatch]);

  // Control actions
  const addControl = useCallback((type: ControlType) => {
    const newControl: UIControl = {
      id: `ctrl_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      name: `${type}Field_${Date.now()}`,
      required: false
    };

    if (type === 'select') {
      newControl.options = [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' }
      ];
    }

    dispatch({ type: 'ADD_CONTROL', payload: newControl });
  }, [dispatch]);

  const updateControl = useCallback((controlId: string, control: UIControl) => {
    dispatch({ type: 'UPDATE_CONTROL', payload: { controlId, control } });
  }, [dispatch]);

  const removeControl = useCallback((controlId: string) => {
    dispatch({ type: 'REMOVE_CONTROL', payload: controlId });
  }, [dispatch]);

  const reorderControls = useCallback((controls: UIControl[]) => {
    dispatch({ type: 'REORDER_CONTROLS', payload: controls });
  }, [dispatch]);

  // Selection actions
  const selectControl = useCallback((controlId: string | null) => {
    dispatch({ type: 'SELECT_CONTROL', payload: controlId });
  }, [dispatch]);

  // Mode actions
  const setMode = useCallback((mode: 'visual' | 'json') => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, [dispatch]);

  // Error actions
  const setErrors = useCallback((errors: ValidationError[]) => {
    dispatch({ type: 'SET_ERRORS', payload: errors });
  }, [dispatch]);

  const clearErrors = useCallback(() => {
    dispatch({ type: 'SET_ERRORS', payload: [] });
  }, [dispatch]);

  // Dirty state actions
  const setDirty = useCallback((isDirty: boolean) => {
    dispatch({ type: 'SET_DIRTY', payload: isDirty });
  }, [dispatch]);

  // History actions
  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, [dispatch]);

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' });
  }, [dispatch]);

  return {
    // Schema actions
    setSchema,
    updateSchemaMetadata,
    
    // Control actions
    addControl,
    updateControl,
    removeControl,
    reorderControls,
    
    // Selection actions
    selectControl,
    
    // Mode actions
    setMode,
    
    // Error actions
    setErrors,
    clearErrors,
    
    // Dirty state actions
    setDirty,
    
    // History actions
    undo,
    redo,
    clearHistory
  };
};

// Custom hook for editor state selectors
export const useEditorState = () => {
  const { state, canUndo, canRedo } = useEditor();

  return {
    // Current state
    schema: state.present.schema,
    selectedControlId: state.present.selectedControlId,
    mode: state.present.mode,
    errors: state.present.errors,
    isDirty: state.present.isDirty,
    
    // Selected control
    selectedControl: state.present.selectedControlId 
      ? state.present.schema.controls.find(c => c.id === state.present.selectedControlId) || null
      : null,
    
    // History state
    canUndo,
    canRedo,
    
    // Computed values
    hasErrors: state.present.errors.length > 0,
    controlCount: state.present.schema.controls.length,
    isVisualMode: state.present.mode === 'visual',
    isJsonMode: state.present.mode === 'json'
  };
};