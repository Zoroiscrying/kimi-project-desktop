import { useState } from 'react';
import { SearchBox } from './SearchBox';
import type { Project } from '../types';

interface ProjectListProps {
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectList({ projects, selectedId, onSelect, onDelete }: ProjectListProps) {
  const [query, setQuery] = useState('');

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.path.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col border-r border-neutral-800 bg-neutral-900 p-4">
      <div className="mb-4">
        <SearchBox value={query} onChange={setQuery} />
      </div>
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-neutral-500">
            {projects.length === 0 ? 'No projects yet.' : 'No projects match your search.'}
          </div>
        ) : (
          filtered.map((project) => (
            <div
              key={project.id}
              tabIndex={0}
              role="button"
              aria-pressed={selectedId === project.id}
              onClick={() => onSelect(project.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(project.id);
                }
              }}
              className={`group relative mb-2 flex cursor-pointer items-start justify-between rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600 ${
                selectedId === project.id ? 'bg-blue-900/40' : 'hover:bg-neutral-800'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-neutral-100">{project.name}</div>
                <div className="truncate text-xs text-neutral-500">{project.path}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id);
                }}
                className="ml-2 shrink-0 rounded p-1 text-neutral-500 hover:bg-neutral-700 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                aria-label={`Delete ${project.name}`}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
