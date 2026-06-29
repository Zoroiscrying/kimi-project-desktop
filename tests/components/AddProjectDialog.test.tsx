import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AddProjectDialog } from '../../src/components/AddProjectDialog';

describe('AddProjectDialog', () => {
  it('renders form when open', () => {
    render(<AddProjectDialog isOpen={true} onClose={vi.fn()} onAdd={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<AddProjectDialog isOpen={false} onClose={vi.fn()} onAdd={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
