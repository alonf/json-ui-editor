import { createContext, useContext, useReducer, ReactNode } from 'react';
import { UISchema, UIControl, ValidationError, EditorState } from '../types/schema';

// Action types
export type EditorAction =
  | { type: 'SET_SCHEMA'; payload: UISchema }
  | { type: 'UPDATE_SCHEMA_METADATA'; payload: Partial<Pick<UISchema, 'title' | 'description' | 'layout'>> }
  | { type: 'UPDATE_CONTROL'; payload: { controlId: string; control: UIControl } }
  | { type: 'ADD_CONTROL'; payload: UIControl }
  | { type: 'REMOVE_CONTROL'; payload: string }
  | { type: 'REORDER_CONTROLS'; payload: UIControl[] }
  | { type: 'SELECT_CONTROL'; payload: string | null }
  | { type: 'SET_MODE'; payload: 'visual' | 'json' }
  | { type: 'SET_ERRORS'; payload: ValidationError[] }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR_HISTORY' };

// Extended state with history management
interface EditorStateWithHistory {
  present: EditorState;
  past: EditorState[];
  future: EditorState[];
}

// Context type
interface EditorContextType {
  state: EditorStateWithHistory;
  dispatch: React.Dispatch<EditorAction>;
  canUndo: boolean;
  canRedo: boolean;
}

// Default schema
const defaultSchema: UISchema = {
  title: 'New Form',
  description: '',
  layout: 'vertical',
  controls: []
};

// Initial state
const initialState: EditorStateWithHistory = {
  present: {
    schema: defaultSchema,
    selectedControlId: null,
    mode: 'visual',
    errors: [],
    isDirty: false
  },
  past: [],
  future: []
};

// Create context
const EditorContext = createContext<EditorContextType | undefined>(undefined);

// Helper function to create new history entry
const createHistoryEntry = (state: EditorStateWithHistory, newPresent: EditorState): EditorStateWithHistory => {
  return {
    present: newPresent,
    past: [...state.past, state.present],
    future: []
  };
};

// Reducer function
export const editorReducer = (state: EditorStateWithHistory, action: EditorAction): EditorStateWithHistory => {
  switch (action.type) {
    case 'SET_SCHEMA': {
      const newPresent = {
        ...state.present,
        schema: action.payload,
        isDirty: true
      };
      return createHistoryEntry(state, newPresent);
    }

    case 'UPDATE_SCHEMA_METADATA': {
      const newPresent = {
        ...state.present,
        schema: {
          ...state.present.schema,
          ...action.payload
        },
        isDirty: true
      };
      return createHistoryEntry(state, newPresent);
    }

    case 'UPDATE_CONTROL': {
      const updatedControls = state.present.schema.controls.map(control =>
        control.id === action.payload.controlId ? action.payload.control : control
      );
      const newPresent = {
        ...state.present,
        schema: {
          ...state.present.schema,
          controls: updatedControls
        },
        isDirty: true
      };
      return createHistoryEntry(state, newPresent);
    }

    case 'ADD_CONTROL': {
      const newPresent = {
        ...state.present,
        schema: {
          ...state.present.schema,
          controls: [...state.present.schema.controls, action.payload]
        },
        selectedControlId: action.payload.id,
        isDirty: true
      };
      return createHistoryEntry(state, newPresent);
    }

    case 'REMOVE_CONTROL': {
      const filteredControls = state.present.schema.controls.filter(
        control => control.id !== action.payload
      );
      const newPresent = {
        ...state.present,
        schema: {
          ...state.present.schema,
          controls: filteredControls
        },
        selectedControlId: state.present.selectedControlId === action.payload ? null : state.present.selectedControlId,
        isDirty: true
      };
      return createHistoryEntry(state, newPresent);
    }

    case 'REORDER_CONTROLS': {
      const newPresent = {
        ...state.present,
        schema: {
          ...state.present.schema,
          controls: action.payload
        },
        isDirty: true
      };
      return createHistoryEntry(state, newPresent);
    }

    case 'SELECT_CONTROL': {
      return {
        ...state,
        present: {
          ...state.present,
          selectedControlId: action.payload
        }
      };
    }

    case 'SET_MODE': {
      return {
        ...state,
        present: {
          ...state.present,
          mode: action.payload
        }
      };
    }

    case 'SET_ERRORS': {
      return {
        ...state,
        present: {
          ...state.present,
          errors: action.payload
        }
      };
    }

    case 'SET_DIRTY': {
      return {
        ...state,
        present: {
          ...state.present,
          isDirty: action.payload
        }
      };
    }

    case 'UNDO': {
      if (state.past.length === 0) return state;
      
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);
      
      return {
        present: previous,
        past: newPast,
        future: [state.present, ...state.future]
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      
      return {
        present: next,
        past: [...state.past, state.present],
        future: newFuture
      };
    }

    case 'CLEAR_HISTORY': {
      return {
        ...state,
        past: [],
        future: []
      };
    }

    default:
      return state;
  }
};

// Provider component
interface EditorProviderProps {
  children: ReactNode;
  initialSchema?: UISchema;
}

export const EditorProvider: React.FC<EditorProviderProps> = ({ children, initialSchema }) => {
  const [state, dispatch] = useReducer(editorReducer, {
    ...initialState,
    present: {
      ...initialState.present,
      schema: initialSchema || defaultSchema
    }
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const contextValue: EditorContextType = {
    state,
    dispatch,
    canUndo,
    canRedo
  };

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
};

// Custom hook to use the editor context
export const useEditor = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};