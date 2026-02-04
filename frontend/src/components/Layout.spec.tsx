import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './Layout';

describe('Layout', () => {
  it('renders header and outlet', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<span>Home content</span>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Cooltest Store')).toBeInTheDocument();
    expect(screen.getByText('Home content')).toBeInTheDocument();
  });
});
