import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders layout with header and main content', () => {
    render(<App />);
    expect(screen.getByText('Cooltest Store')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
