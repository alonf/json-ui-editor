import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ControlPalette } from '../ControlPalette';
import { EditorProvider } from '../../context/EditorContext';
import { ControlType } from '../../types/schema';

// Mock CSS import
vi.mock('../ControlPalette.css', () => ({}));

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <EditorProvider>
      {component}
    </EditorProvider>
  );
};

describe('ControlPalette', () => {
  const mockOnAddControl = vi.fn();

  beforeEach(() => {
    mockOnAddControl.mockClear();
  });

  it('renders all control types', () => {
    renderWithProvider(<ControlPalette onAddControl={mockOnAddControl} />);
    
    expect(screen.getByText('Text Input')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Text Area')).toBeInTheDocument();
    expect(screen.getByText('Number')).toBeInTheDocument();
    expect(screen.getByText('Select')).toBeInTheDocument();
    expect(screen.getByText('Checkbox')).toBeInTheDocument();
    expect(screen.getByText('Button')).toBeInTheDocument();
  });

  it('displays the correct title and subtitle', () => {
    renderWithProvider(<ControlPalette onAddControl={mockOnAddControl} />);
    
    expect(screen.getByText('Controls')).toBeInTheDocument();
    expect(screen.getByText('Click to add controls to your form')).toBeInTheDocument();
  });

  it('calls onAddControl when a control type is clicked', () => {
    renderWithProvider(<ControlPalette onAddControl={mockOnAddControl} />);
    
    const textInputButton = screen.getByLabelText('Add Text Input control');
    fireEvent.click(textInputButton);
    
    expect(mockOnAddControl).toHaveBeenCalledWith('text');
  });

  it('calls onAddControl when Enter key is pressed on a control', () => {
    renderWithProvider(<ControlPalette onAddControl={mockOnAddControl} />);
    
    const emailButton = screen.getByLabelText('Add Email control');
    fireEvent.keyDown(emailButton, { key: 'Enter' });
    
    expect(mockOnAddControl).toHaveBeenCalledWith('email');
  });

  it('calls onAddControl when Space key is pressed on a control', () => {
    renderWithProvider(<ControlPalette onAddControl={mockOnAddControl} />);
    
    const selectButton = screen.getByLabelText('Add Select control');
    fireEvent.keyDown(selectButton, { key: ' ' });
    
    expect(mockOnAddControl).toHaveBeenCalledWith('select');
  });

  it('does not call onAddControl for other keys', () => {
    renderWithProvider(<ControlPalette onAddControl={mockOnAddControl} />);
    
    const checkboxButton = screen.getByLabelText('Add Checkbox control');
    fireEvent.keyDown(checkboxButton, { key: 'Tab' });
    
    expect(mockOnAddControl).not.toHaveBeenCalled();
  });

  it('shows hint when no controls are present', () => {
    renderWithProvider(<ControlPalette onAddControl={mockOnAddControl} />);
    
    expect(screen.getByText('Start building your form by adding controls from above')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderWithProvider(<ControlPalette onAddControl={mockOnAddControl} />);
    
    const textInputButton = screen.getByLabelText('Add Text Input control');
    expect(textInputButton).toHaveAttribute('title', 'Single line text input');
    
    const emailButton = screen.getByLabelText('Add Email control');
    expect(emailButton).toHaveAttribute('title', 'Email address input');
  });

  it('renders control icons', () => {
    renderWithProvider(<ControlPalette onAddControl={mockOnAddControl} />);
    
    // Check that emoji icons are present
    expect(screen.getByText('📝')).toBeInTheDocument(); // Text input
    expect(screen.getByText('📧')).toBeInTheDocument(); // Email
    expect(screen.getByText('🔒')).toBeInTheDocument(); // Password
  });
});