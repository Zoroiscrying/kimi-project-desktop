import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toast } from '../../src/components/Toast';

describe('Toast', () => {
  it('renders message', () => {
    render(<Toast message="Something went wrong" onClose={vi.fn()} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
