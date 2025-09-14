import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';
import { AuthProvider } from '../contexts/AuthContext';

describe('App', () => {
  it('opens the editor after clicking the button', () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );

    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();

    const openBtn = screen.getByRole('button', { name: 'افتح محرر السيناريو' });
    fireEvent.click(openBtn);
    const editorElement = screen.getByTestId('rich-text-editor');
    expect(editorElement).toBeInTheDocument();
  });
});
