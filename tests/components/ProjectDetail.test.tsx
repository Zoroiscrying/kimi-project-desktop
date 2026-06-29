import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectDetail } from '../../src/components/ProjectDetail';

const project = {
  id: '1',
  name: 'web-app',
  path: '/tmp/web-app',
  description: 'Frontend app',
  createdAt: '2026-06-29T00:00:00Z',
  updatedAt: '2026-06-29T00:00:00Z',
};

describe('ProjectDetail', () => {
  it('renders project name and path', () => {
    render(<ProjectDetail project={project} sessions={[]} onOpenKimi={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByText('web-app')).toBeInTheDocument();
    expect(screen.getByText('/tmp/web-app')).toBeInTheDocument();
  });

  it('calls onOpenKimi when button clicked', () => {
    const onOpenKimi = vi.fn();
    render(<ProjectDetail project={project} sessions={[]} onOpenKimi={onOpenKimi} onEdit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /open in kimi/i }));
    expect(onOpenKimi).toHaveBeenCalled();
  });
});
