import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';

interface AddProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (input: { name: string; path: string; description?: string }) => Promise<void>;
}

export function AddProjectDialog({ isOpen, onClose, onAdd }: AddProjectDialogProps) {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const pickDirectory = async () => {
    const selected = await open({ directory: true });
    if (typeof selected === 'string') {
      setPath(selected);
      if (!name) {
        const parts = selected.replace(/\\/g, '/').split('/');
        setName(parts[parts.length - 1] || '');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !path) return;
    await onAdd({ name, path, description: description || undefined });
    setName('');
    setPath('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-lg bg-neutral-900 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-neutral-100">Add Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-neutral-400">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md bg-neutral-800 px-3 py-2 text-neutral-100 outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-400">Path</label>
            <div className="flex gap-2">
              <input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                className="flex-1 rounded-md bg-neutral-800 px-3 py-2 text-neutral-100 outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
              <button
                type="button"
                onClick={pickDirectory}
                className="rounded-md bg-neutral-700 px-3 py-2 text-sm text-neutral-100 hover:bg-neutral-600"
              >
                Browse
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-400">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md bg-neutral-800 px-3 py-2 text-neutral-100 outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-neutral-800 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
