import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders the main application and the rich text editor', () => {
    render(<App />);

    // Check if the main container is rendered
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();

    // Check for the editor specifically by its test-id
    const editorElement = screen.getByTestId('rich-text-editor');
    expect(editorElement).toBeInTheDocument();
  });
});
