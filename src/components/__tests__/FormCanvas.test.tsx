import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { FormCanvas } from '../FormCanvas';
import { UIControl } from '../../types/schema';
import { EditorProvider } from '../../context/EditorContext';

// Mock react-beautiful-dnd
vi.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children, onDragEnd }: any) => (
    <div data-testid="drag-drop-context" data-on-drag-end={onDragEnd}>
      {children}
    </div>
  ),
  Droppable: ({ children }: any) => (
    <div data-testid="droppable">
      {children({ 
        droppableProps: {}, 
        innerRef: vi.fn(),
        placeholder: <div data-testid="placeholder" />
      }, { isDraggingOver: false })}
    </div>
  ),
  Draggable: ({ children, draggableId }: any) => (
    <div data-testid={`draggable-${draggableId}`}>
      {children({
        innerRef: vi.fn(),
        draggableProps: {},
        dragHandleProps: {},
      }, { isDragging: false })}
    </div>
  ),
}));

const mockControls: UIControl[] = [
  {
    id: 'ctrl-1',
    type: 'text',
    label: 'Full Name',
    name: 'fullName',
    required: true,
    validation: { minLength: 2, maxLength: 50 }
  },
  {
    id: 'ctrl-2',
    type: 'email',
    label: 'Email Address',
    name: 'email',
    placeholder: 'Enter your email'
  },
  {
    id: 'ctrl-3',
    type: 'select',
    label: 'Country',
    name: 'country',
    options: [
      { label: 'USA', value: 'us' },
      { label: 'Canada', value: 'ca' }
    ]
  }
];

const defaultProps = {
  controls: mockControls,
  selectedControlId: null,
  onControlSelect: vi.fn(),
  onControlsReorder: vi.fn(),
};

const renderWithProvider = (props = defaultProps) => {
  return render(
    <EditorProvider>
      <FormCanvas {...props} />
    </EditorProvider>
  );
};

describe('FormCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    it('should display empty state when no controls are provided', () => {
      renderWithProvider({ ...defaultProps, controls: [] });
      
      expect(screen.getByText('No controls yet')).toBeInTheDocument();
      expect(screen.getByText('Add controls from the palette to start building your form')).toBeInTheDocument();
      expect(screen.getByText('📝')).toBeInTheDocument();
    });

    it('should have proper CSS class for empty state', () => {
      const { container } = renderWithProvider({ ...defaultProps, controls: [] });
      expect(container.querySelector('.form-canvas--empty')).toBeInTheDocument();
    });
  });

  describe('Controls Display', () => {
    it('should render all provided controls', () => {
      renderWithProvider();
      
      expect(screen.getByText('Full Name')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Country')).toBeInTheDocument();
    });

    it('should display control types correctly', () => {
      renderWithProvider();
      
      expect(screen.getByText('text')).toBeInTheDocument();
      expect(screen.getByText('email')).toBeInTheDocument();
      expect(screen.getByText('select')).toBeInTheDocument();
    });

    it('should show required indicator for required controls', () => {
      renderWithProvider();
      
      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators).toHaveLength(1);
    });

    it('should display control names when present', () => {
      renderWithProvider();
      
      expect(screen.getByText('name: fullName')).toBeInTheDocument();
      expect(screen.getByText('name: email')).toBeInTheDocument();
      expect(screen.getByText('name: country')).toBeInTheDocument();
    });

    it('should display placeholders when present', () => {
      renderWithProvider();
      
      expect(screen.getByText('placeholder: "Enter your email"')).toBeInTheDocument();
    });

    it('should display validation rules when present', () => {
      renderWithProvider();
      
      expect(screen.getByText('min: 2')).toBeInTheDocument();
      expect(screen.getByText('max: 50')).toBeInTheDocument();
    });
  });

  describe('Control Selection', () => {
    it('should call onControlSelect when a control is clicked', () => {
      const onControlSelect = vi.fn();
      renderWithProvider({ ...defaultProps, onControlSelect });
      
      const firstControl = screen.getByText('Full Name').closest('.form-canvas__control-item');
      fireEvent.click(firstControl!);
      
      expect(onControlSelect).toHaveBeenCalledWith('ctrl-1');
    });

    it('should apply selected class to selected control', () => {
      renderWithProvider({ ...defaultProps, selectedControlId: 'ctrl-1' });
      
      const selectedControl = screen.getByText('Full Name').closest('.form-canvas__control-item');
      expect(selectedControl).toHaveClass('form-canvas__control-item--selected');
    });

    it('should handle keyboard navigation for control selection', () => {
      const onControlSelect = vi.fn();
      renderWithProvider({ ...defaultProps, onControlSelect });
      
      const firstControl = screen.getByText('Full Name').closest('.form-canvas__control-item');
      fireEvent.keyDown(firstControl!, { key: 'Enter' });
      
      expect(onControlSelect).toHaveBeenCalledWith('ctrl-1');
    });

    it('should handle space key for control selection', () => {
      const onControlSelect = vi.fn();
      renderWithProvider({ ...defaultProps, onControlSelect });
      
      const firstControl = screen.getByText('Full Name').closest('.form-canvas__control-item');
      fireEvent.keyDown(firstControl!, { key: ' ' });
      
      expect(onControlSelect).toHaveBeenCalledWith('ctrl-1');
    });
  });

  describe('Control Removal', () => {
    it('should render remove buttons for all controls', () => {
      renderWithProvider();
      
      const removeButtons = screen.getAllByTitle('Remove control');
      expect(removeButtons).toHaveLength(3);
    });

    it('should have proper aria-labels for remove buttons', () => {
      renderWithProvider();
      
      expect(screen.getByLabelText('Remove Full Name control')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove Email Address control')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove Country control')).toBeInTheDocument();
    });

    it('should stop propagation when remove button is clicked', () => {
      const onControlSelect = vi.fn();
      renderWithProvider({ ...defaultProps, onControlSelect });
      
      const removeButton = screen.getByLabelText('Remove Full Name control');
      fireEvent.click(removeButton);
      
      // onControlSelect should not be called when remove button is clicked
      expect(onControlSelect).not.toHaveBeenCalled();
    });
  });

  describe('Drag and Drop', () => {
    it('should render DragDropContext', () => {
      renderWithProvider();
      
      expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument();
    });

    it('should render Droppable area', () => {
      renderWithProvider();
      
      expect(screen.getByTestId('droppable')).toBeInTheDocument();
    });

    it('should render Draggable items for each control', () => {
      renderWithProvider();
      
      expect(screen.getByTestId('draggable-ctrl-1')).toBeInTheDocument();
      expect(screen.getByTestId('draggable-ctrl-2')).toBeInTheDocument();
      expect(screen.getByTestId('draggable-ctrl-3')).toBeInTheDocument();
    });

    it('should render placeholder for drag and drop', () => {
      renderWithProvider();
      
      expect(screen.getByTestId('placeholder')).toBeInTheDocument();
    });
  });

  describe('Header', () => {
    it('should display form canvas header', () => {
      renderWithProvider();
      
      expect(screen.getByText('Form Structure')).toBeInTheDocument();
      expect(screen.getByText('Drag to reorder • Click to select • Press Delete to remove')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for controls', () => {
      renderWithProvider();
      
      const firstControl = screen.getByLabelText('text control: Full Name');
      expect(firstControl).toHaveAttribute('role', 'button');
      expect(firstControl).toHaveAttribute('tabIndex', '0');
    });

    it('should indicate selected state in ARIA', () => {
      renderWithProvider({ ...defaultProps, selectedControlId: 'ctrl-1' });
      
      const selectedControl = screen.getByLabelText('text control: Full Name');
      expect(selectedControl).toHaveAttribute('aria-selected', 'true');
    });

    it('should have proper focus management', () => {
      renderWithProvider();
      
      const controlItems = screen.getAllByLabelText(/control:/);
      controlItems.forEach(control => {
        expect(control).toHaveAttribute('tabIndex', '0');
      });
    });
  });

  describe('Control Icons', () => {
    it('should display appropriate icons for different control types', () => {
      renderWithProvider();
      
      // Check that control items are rendered with icons
      const controlItems = screen.getAllByLabelText(/control:/);
      expect(controlItems).toHaveLength(3);
      
      // Each control should have an icon element
      controlItems.forEach(item => {
        const icon = item.querySelector('.form-canvas__control-icon');
        expect(icon).toBeInTheDocument();
      });
    });
  });
});