import * as React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { UIControl } from '../types/schema';
import { useEditor } from '../context/EditorContext';
import './FormCanvas.css';

interface FormCanvasProps {
  controls: UIControl[];
  selectedControlId: string | null;
  onControlSelect: (controlId: string) => void;
  onControlsReorder: (controls: UIControl[]) => void;
}

interface ControlItemProps {
  control: UIControl;
  isSelected: boolean;
  onSelect: (controlId: string) => void;
  onRemove: (controlId: string) => void;
}

const ControlItem: React.FC<ControlItemProps> = ({ control, isSelected, onSelect, onRemove }) => {
  const getControlIcon = (type: string): string => {
    const icons: Record<string, string> = {
      text: '📝',
      email: '📧',
      password: '🔒',
      textarea: '📄',
      number: '🔢',
      select: '📋',
      checkbox: '☑️',
      button: '🔘'
    };
    return icons[type] || '📝';
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(control.id);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      onRemove(control.id);
    }
  };

  return (
    <div
      className={`form-canvas__control-item ${isSelected ? 'form-canvas__control-item--selected' : ''}`}
      onClick={() => onSelect(control.id)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${control.type} control: ${control.label}`}
      aria-selected={isSelected}
    >
      <div className="form-canvas__control-header">
        <div className="form-canvas__control-icon">
          {getControlIcon(control.type)}
        </div>
        <div className="form-canvas__control-info">
          <div className="form-canvas__control-label">
            {control.label || `${control.type} control`}
          </div>
          <div className="form-canvas__control-type">
            {control.type}
            {control.required && <span className="form-canvas__required">*</span>}
          </div>
        </div>
        <button
          className="form-canvas__control-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(control.id);
          }}
          aria-label={`Remove ${control.label || control.type} control`}
          title="Remove control"
        >
          ×
        </button>
      </div>
      
      {control.name && (
        <div className="form-canvas__control-name">
          name: {control.name}
        </div>
      )}
      
      {control.placeholder && (
        <div className="form-canvas__control-placeholder">
          placeholder: "{control.placeholder}"
        </div>
      )}
      
      {control.validation && (
        <div className="form-canvas__control-validation">
          {control.validation.minLength && (
            <span>min: {control.validation.minLength}</span>
          )}
          {control.validation.maxLength && (
            <span>max: {control.validation.maxLength}</span>
          )}
          {control.validation.pattern && (
            <span>pattern: {control.validation.pattern}</span>
          )}
        </div>
      )}
    </div>
  );
};

export const FormCanvas: React.FC<FormCanvasProps> = ({
  controls,
  selectedControlId,
  onControlSelect,
  onControlsReorder
}) => {
  const { dispatch } = useEditor();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) {
      return;
    }

    const reorderedControls = Array.from(controls);
    const [removed] = reorderedControls.splice(sourceIndex, 1);
    reorderedControls.splice(destinationIndex, 0, removed);

    onControlsReorder(reorderedControls);
  };

  const handleControlRemove = (controlId: string) => {
    dispatch({ type: 'REMOVE_CONTROL', payload: controlId });
  };

  if (controls.length === 0) {
    return (
      <div className="form-canvas form-canvas--empty">
        <div className="form-canvas__empty-state">
          <div className="form-canvas__empty-icon">📝</div>
          <h3 className="form-canvas__empty-title">No controls yet</h3>
          <p className="form-canvas__empty-description">
            Add controls from the palette to start building your form
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-canvas">
      <div className="form-canvas__header">
        <h3 className="form-canvas__title">Form Structure</h3>
        <p className="form-canvas__subtitle">
          Drag to reorder • Click to select • Press Delete to remove
        </p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="form-controls">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`form-canvas__controls ${
                snapshot.isDraggingOver ? 'form-canvas__controls--dragging' : ''
              }`}
            >
              {controls.map((control, index) => (
                <Draggable key={control.id} draggableId={control.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`form-canvas__draggable ${
                        snapshot.isDragging ? 'form-canvas__draggable--dragging' : ''
                      }`}
                    >
                      <ControlItem
                        control={control}
                        isSelected={selectedControlId === control.id}
                        onSelect={onControlSelect}
                        onRemove={handleControlRemove}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};