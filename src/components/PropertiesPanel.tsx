import * as React from 'react';
import { UIControl, ControlType, SelectOption, ValidationRules } from '../types/schema';
import { useEditor } from '../context/EditorContext';
import './PropertiesPanel.css';

interface PropertiesPanelProps {
  control: UIControl | null;
  onControlUpdate: (control: UIControl) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ control, onControlUpdate }) => {
  const { dispatch } = useEditor();

  // Handle control property updates
  const handlePropertyChange = (property: keyof UIControl, value: any) => {
    if (!control) return;

    const updatedControl = {
      ...control,
      [property]: value
    };

    onControlUpdate(updatedControl);
    dispatch({ type: 'UPDATE_CONTROL', payload: { controlId: control.id, control: updatedControl } });
  };

  // Handle validation rule updates
  const handleValidationChange = (rule: keyof ValidationRules, value: any) => {
    if (!control) return;

    const updatedValidation = {
      ...control.validation,
      [rule]: value === '' ? undefined : value
    };

    // Remove empty validation object
    const cleanValidation = Object.keys(updatedValidation).length === 0 ? undefined : updatedValidation;

    const updatedControl = {
      ...control,
      validation: cleanValidation
    };

    onControlUpdate(updatedControl);
    dispatch({ type: 'UPDATE_CONTROL', payload: { controlId: control.id, control: updatedControl } });
  };

  // Handle select options updates
  const handleOptionsChange = (options: SelectOption[]) => {
    if (!control) return;

    const updatedControl = {
      ...control,
      options: options.length === 0 ? undefined : options
    };

    onControlUpdate(updatedControl);
    dispatch({ type: 'UPDATE_CONTROL', payload: { controlId: control.id, control: updatedControl } });
  };

  // Add new option for select controls
  const addOption = () => {
    const currentOptions = control?.options || [];
    const newOption: SelectOption = {
      label: `Option ${currentOptions.length + 1}`,
      value: `option_${currentOptions.length + 1}`
    };
    handleOptionsChange([...currentOptions, newOption]);
  };

  // Remove option from select controls
  const removeOption = (index: number) => {
    const currentOptions = control?.options || [];
    const updatedOptions = currentOptions.filter((_, i) => i !== index);
    handleOptionsChange(updatedOptions);
  };

  // Update specific option
  const updateOption = (index: number, field: keyof SelectOption, value: string) => {
    const currentOptions = control?.options || [];
    const updatedOptions = currentOptions.map((option, i) => 
      i === index ? { ...option, [field]: value } : option
    );
    handleOptionsChange(updatedOptions);
  };

  if (!control) {
    return (
      <div className="properties-panel properties-panel--empty">
        <div className="properties-panel__empty-state">
          <div className="properties-panel__empty-icon">⚙️</div>
          <h3 className="properties-panel__empty-title">No control selected</h3>
          <p className="properties-panel__empty-description">
            Select a control from the form canvas to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const controlSupportsOptions = control.type === 'select';
  const controlSupportsValidation = ['text', 'email', 'password', 'textarea', 'number'].includes(control.type);

  return (
    <div className="properties-panel">
      <div className="properties-panel__header">
        <h3 className="properties-panel__title">Properties</h3>
        <div className="properties-panel__control-type">
          {control.type} control
        </div>
      </div>

      <div className="properties-panel__content">
        {/* Basic Properties */}
        <div className="properties-panel__section">
          <h4 className="properties-panel__section-title">Basic Properties</h4>
          
          <div className="properties-panel__field">
            <label className="properties-panel__label" htmlFor="control-label">
              Label *
            </label>
            <input
              id="control-label"
              type="text"
              className="properties-panel__input"
              value={control.label}
              onChange={(e) => handlePropertyChange('label', e.target.value)}
              placeholder="Enter control label"
              required
            />
          </div>

          <div className="properties-panel__field">
            <label className="properties-panel__label" htmlFor="control-name">
              Name *
            </label>
            <input
              id="control-name"
              type="text"
              className="properties-panel__input"
              value={control.name}
              onChange={(e) => handlePropertyChange('name', e.target.value)}
              placeholder="Enter field name"
              pattern="[a-zA-Z_][a-zA-Z0-9_]*"
              title="Must start with letter or underscore, followed by letters, numbers, or underscores"
              required
            />
          </div>

          {control.type !== 'button' && control.type !== 'checkbox' && (
            <div className="properties-panel__field">
              <label className="properties-panel__label" htmlFor="control-placeholder">
                Placeholder
              </label>
              <input
                id="control-placeholder"
                type="text"
                className="properties-panel__input"
                value={control.placeholder || ''}
                onChange={(e) => handlePropertyChange('placeholder', e.target.value || undefined)}
                placeholder="Enter placeholder text"
              />
            </div>
          )}

          <div className="properties-panel__field">
            <label className="properties-panel__label" htmlFor="control-class">
              CSS Class
            </label>
            <input
              id="control-class"
              type="text"
              className="properties-panel__input"
              value={control.className || ''}
              onChange={(e) => handlePropertyChange('className', e.target.value || undefined)}
              placeholder="Enter CSS class names"
            />
          </div>

          <div className="properties-panel__field">
            <label className="properties-panel__checkbox-label">
              <input
                type="checkbox"
                className="properties-panel__checkbox"
                checked={control.required || false}
                onChange={(e) => handlePropertyChange('required', e.target.checked || undefined)}
              />
              Required field
            </label>
          </div>
        </div>

        {/* Select Options */}
        {controlSupportsOptions && (
          <div className="properties-panel__section">
            <h4 className="properties-panel__section-title">Options</h4>
            
            <div className="properties-panel__options">
              {(control.options || []).map((option, index) => (
                <div key={index} className="properties-panel__option">
                  <div className="properties-panel__option-fields">
                    <input
                      type="text"
                      className="properties-panel__input properties-panel__input--small"
                      value={option.label}
                      onChange={(e) => updateOption(index, 'label', e.target.value)}
                      placeholder="Label"
                    />
                    <input
                      type="text"
                      className="properties-panel__input properties-panel__input--small"
                      value={option.value}
                      onChange={(e) => updateOption(index, 'value', e.target.value)}
                      placeholder="Value"
                    />
                  </div>
                  <button
                    type="button"
                    className="properties-panel__option-remove"
                    onClick={() => removeOption(index)}
                    aria-label={`Remove option ${option.label}`}
                    title="Remove option"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                className="properties-panel__add-option"
                onClick={addOption}
              >
                + Add Option
              </button>
            </div>
          </div>
        )}

        {/* Validation Rules */}
        {controlSupportsValidation && (
          <div className="properties-panel__section">
            <h4 className="properties-panel__section-title">Validation</h4>
            
            {(control.type === 'text' || control.type === 'email' || control.type === 'password' || control.type === 'textarea') && (
              <>
                <div className="properties-panel__field">
                  <label className="properties-panel__label" htmlFor="validation-min-length">
                    Minimum Length
                  </label>
                  <input
                    id="validation-min-length"
                    type="number"
                    className="properties-panel__input"
                    value={control.validation?.minLength || ''}
                    onChange={(e) => handleValidationChange('minLength', e.target.value ? parseInt(e.target.value) : undefined)}
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div className="properties-panel__field">
                  <label className="properties-panel__label" htmlFor="validation-max-length">
                    Maximum Length
                  </label>
                  <input
                    id="validation-max-length"
                    type="number"
                    className="properties-panel__input"
                    value={control.validation?.maxLength || ''}
                    onChange={(e) => handleValidationChange('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                    min="0"
                    placeholder="No limit"
                  />
                </div>

                <div className="properties-panel__field">
                  <label className="properties-panel__label" htmlFor="validation-pattern">
                    Pattern (RegEx)
                  </label>
                  <input
                    id="validation-pattern"
                    type="text"
                    className="properties-panel__input"
                    value={control.validation?.pattern || ''}
                    onChange={(e) => handleValidationChange('pattern', e.target.value || undefined)}
                    placeholder="Enter regular expression"
                  />
                </div>
              </>
            )}

            {control.type === 'number' && (
              <>
                <div className="properties-panel__field">
                  <label className="properties-panel__label" htmlFor="validation-min">
                    Minimum Value
                  </label>
                  <input
                    id="validation-min"
                    type="number"
                    className="properties-panel__input"
                    value={control.validation?.min || ''}
                    onChange={(e) => handleValidationChange('min', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="No minimum"
                  />
                </div>

                <div className="properties-panel__field">
                  <label className="properties-panel__label" htmlFor="validation-max">
                    Maximum Value
                  </label>
                  <input
                    id="validation-max"
                    type="number"
                    className="properties-panel__input"
                    value={control.validation?.max || ''}
                    onChange={(e) => handleValidationChange('max', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="No maximum"
                  />
                </div>
              </>
            )}

            <div className="properties-panel__field">
              <label className="properties-panel__label" htmlFor="validation-custom-message">
                Custom Error Message
              </label>
              <textarea
                id="validation-custom-message"
                className="properties-panel__textarea"
                value={control.validation?.customMessage || ''}
                onChange={(e) => handleValidationChange('customMessage', e.target.value || undefined)}
                placeholder="Enter custom validation message"
                rows={2}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};