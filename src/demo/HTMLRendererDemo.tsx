import React from 'react';
import { HTMLRenderer } from '../components/HTMLRenderer';
import { UISchema } from '../types/schema';

/**
 * Demo component to showcase HTMLRenderer functionality
 */
export const HTMLRendererDemo: React.FC = () => {
  const sampleSchema: UISchema = {
    title: 'Contact Form',
    description: 'Please fill out this contact form to get in touch with us.',
    layout: 'vertical',
    controls: [
      {
        id: 'fullName',
        type: 'text',
        label: 'Full Name',
        name: 'fullName',
        placeholder: 'Enter your full name',
        required: true,
        validation: {
          minLength: 2,
          maxLength: 50,
          customMessage: 'Please enter a valid name (2-50 characters)'
        }
      },
      {
        id: 'email',
        type: 'email',
        label: 'Email Address',
        name: 'email',
        placeholder: 'Enter your email address',
        required: true,
        validation: {
          customMessage: 'Please enter a valid email address'
        }
      },
      {
        id: 'phone',
        type: 'text',
        label: 'Phone Number',
        name: 'phone',
        placeholder: '(555) 123-4567',
        validation: {
          pattern: '\\([0-9]{3}\\) [0-9]{3}-[0-9]{4}',
          customMessage: 'Please enter phone in format: (555) 123-4567'
        }
      },
      {
        id: 'age',
        type: 'number',
        label: 'Age',
        name: 'age',
        placeholder: 'Enter your age',
        validation: {
          min: 18,
          max: 120,
          customMessage: 'Age must be between 18 and 120'
        }
      },
      {
        id: 'country',
        type: 'select',
        label: 'Country',
        name: 'country',
        required: true,
        options: [
          { label: 'United States', value: 'us' },
          { label: 'Canada', value: 'ca' },
          { label: 'United Kingdom', value: 'uk' },
          { label: 'Australia', value: 'au' },
          { label: 'Germany', value: 'de' }
        ]
      },
      {
        id: 'message',
        type: 'textarea',
        label: 'Message',
        name: 'message',
        placeholder: 'Enter your message here...',
        required: true,
        validation: {
          minLength: 10,
          maxLength: 1000,
          customMessage: 'Message must be between 10 and 1000 characters'
        }
      },
      {
        id: 'newsletter',
        type: 'checkbox',
        label: 'Subscribe to our newsletter',
        name: 'newsletter'
      },
      {
        id: 'terms',
        type: 'checkbox',
        label: 'I agree to the terms and conditions',
        name: 'terms',
        required: true
      },
      {
        id: 'submit',
        type: 'button',
        label: 'Send Message',
        name: 'submit',
        className: 'primary-button'
      }
    ]
  };

  const handleFormSubmit = (data: Record<string, any>) => {
    console.log('Form submitted with data:', data);
    alert('Form submitted successfully! Check the console for details.');
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>HTML Renderer Demo</h1>
      <p>This demo shows the HTMLRenderer component converting a JSON schema to an interactive HTML form.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <HTMLRenderer 
          schema={sampleSchema} 
          onSubmit={handleFormSubmit}
          className="demo-form"
        />
      </div>

      <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Schema JSON:</h3>
        <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
          {JSON.stringify(sampleSchema, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default HTMLRendererDemo;