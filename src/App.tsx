import { useEffect, useState } from 'react';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { EmptyState } from './components/EmptyState';
import { AddProjectDialog } from './components/AddProjectDialog';
import { EditProjectDialog } from './components/EditProjectDialog';
import { useAppStore } from './store/useAppStore';
import type { Project } from './types';

function App() {
  const {
    projects,
    sessions,
    loaded,
    error,
    loadState,
    addProject,
    updateProject,
    deleteProject,
    openKimi,
  } = useAppStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    setEditingProject(projects.find((p) => p.id === selectedId) || null);
  }, [selectedId, projects]);

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 text-red-400">
        Error: {error}
      </div>
    );
  }

  const selectedProject = projects.find((p) => p.id === selectedId) || null;

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100">
      <div className="w-72 flex-shrink-0">
        <ProjectList
          projects={projects}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDelete={deleteProject}
        />
        <div className="border-r border-neutral-800 bg-neutral-900 p-4">
          <button
            onClick={() => setIsAddOpen(true)}
            className="w-full rounded-md bg-blue-700 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            + Add Project
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {selectedProject ? (
          <ProjectDetail
            project={selectedProject}
            sessions={sessions}
            onOpenKimi={() => openKimi(selectedProject)}
            onEdit={() => setIsEditOpen(true)}
          />
        ) : (
          <EmptyState />
        )}
      </div>
      <AddProjectDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={addProject}
      />
      <EditProjectDialog
        project={editingProject}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={updateProject}
      />
    </div>
  );
}

export default App;
