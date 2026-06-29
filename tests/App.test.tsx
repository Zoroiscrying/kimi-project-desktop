import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

const mockInvoke = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

describe('App', () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    mockInvoke.mockResolvedValue({
      version: 1,
      projects: [],
      sessions: [],
      settings: { theme: 'dark' },
    });
  });

  it('renders import from Kimi button', async () => {
    render(<App />);
    expect(await screen.findByText('Import from Kimi')).toBeInTheDocument();
  });
});
