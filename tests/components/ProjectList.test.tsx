import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectList } from '../../src/components/ProjectList';

const projects = [
  { id: '1', name: 'web-app', path: '/tmp/web-app', createdAt: '2026-06-29T00:00:00Z', updatedAt: '2026-06-29T00:00:00Z' },
  { id: '2', name: 'backend', path: '/tmp/backend', createdAt: '2026-06-29T00:00:00Z', updatedAt: '2026-06-29T00:00:00Z' },
];

describe('ProjectList', () => {
  it('renders project names', () => {
    render(<ProjectList projects={projects} selectedId={null} onSelect={() => {}} onDelete={vi.fn()} />);
    expect(screen.getByText('web-app')).toBeInTheDocument();
    expect(screen.getByText('backend')).toBeInTheDocument();
  });

  it('filters projects by search', () => {
    render(<ProjectList projects={projects} selectedId={null} onSelect={() => {}} onDelete={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Search projects...'), { target: { value: 'web' } });
    expect(screen.getByText('web-app')).toBeInTheDocument();
    expect(screen.queryByText('backend')).not.toBeInTheDocument();
  });
});
