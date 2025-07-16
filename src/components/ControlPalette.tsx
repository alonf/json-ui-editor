import * as React from 'react';
import { ControlType } from '../types/schema';
import { useEditor } from '../context/EditorContext';
import './ControlPalette.css';

interface ControlPaletteProps {
  onAddControl: (type: ControlType) => void;
}

interface ControlTypeInfo {
  type: ControlType;
  label: string;
  icon: string;
  description: string;
}

const controlTypes: ControlTypeInfo[] = [
  {
    type: 'text',
    label: 'Text Input',
    icon: '📝',
    description: 'Single line text input'
  },
  {
    type: 'email',
    label: 'Email',
    icon: '📧',
    description: 'Email address input'
  },
  {
    type: 'password',
    label: 'Password',
    icon: '🔒',
    description: 'Password input field'
  },
  {
    type: 'textarea',
    label: 'Text Area',
    icon: '📄',
    description: 'Multi-line text input'
  },
  {
    type: 'number',
    label: 'Number',
    icon: '🔢',
    description: 'Numeric input field'
  },
  {
    type: 'select',
    label: 'Select',
    icon: '📋',
    description: 'Dropdown selection'
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: '☑️',
    description: 'Boolean checkbox input'
  },
  {
    type: 'button',
    label: 'Button',
    icon: '🔘',
    description: 'Action button'
  }
];

export const ControlPalette: React.FC<ControlPaletteProps> = ({ onAddControl }) => {
  const { state } = useEditor();

  const handleControlClick = (type: ControlType) => {
    onAddControl(type);
  };

  const handleKeyDown = (event: React.KeyboardEvent, type: ControlType) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onAddControl(type);
    }
  };

  return (
    <div className="control-palette">
      <div className="control-palette__header">
        <h3 className="control-palette__title">Controls</h3>
        <p className="control-palette__subtitle">Click to add controls to your form</p>
      </div>
      
      <div className="control-palette__grid">
        {controlTypes.map((controlType) => (
          <button
            key={controlType.type}
            className="control-palette__item"
            onClick={() => handleControlClick(controlType.type)}
            onKeyDown={(e) => handleKeyDown(e, controlType.type)}
            title={controlType.description}
            aria-label={`Add ${controlType.label} control`}
          >
            <div className="control-palette__item-icon">
              {controlType.icon}
            </div>
            <div className="control-palette__item-label">
              {controlType.label}
            </div>
          </button>
        ))}
      </div>
      
      {state.present.schema.controls.length === 0 && (
        <div className="control-palette__hint">
          <p>Start building your form by adding controls from above</p>
        </div>
      )}
    </div>
  );
};