import { useEffect, useRef, useState } from 'react';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { EmptyState } from './components/EmptyState';
import { Terminal, type TerminalHandle } from './components/Terminal';
import { RightPanel } from './components/RightPanel';
import { CommandInput } from './components/CommandInput';
import { AddProjectDialog } from './components/AddProjectDialog';
import { EditProjectDialog } from './components/EditProjectDialog';
import { Toast } from './components/Toast';
import { useAppStore } from './store/useAppStore';

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
    importKimiProjects,
    clearError,
  } = useAppStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const terminalRef = useRef<TerminalHandle>(null);

  useEffect(() => {
    loadState();
  }, [loadState]);

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950 text-neutral-400">
        Loading...
      </div>
    );
  }

  const selectedProject = projects.find((p) => p.id === selectedId) || null;
  const editingProject = selectedProject;

  const handleDelete = async (id: string) => {
    await deleteProject(id);
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const handleCommandSubmit = (command: string) => {
    terminalRef.current?.sendCommand(command);
    terminalRef.current?.focus();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-neutral-100">
      {/* Left sidebar */}
      <div className="flex w-64 flex-shrink-0 flex-col overflow-hidden border-r border-neutral-800 bg-neutral-900">
        <div className="flex-1 overflow-hidden">
          <ProjectList
            projects={projects}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDelete={handleDelete}
          />
        </div>
        <div className="shrink-0 space-y-2 border-t border-neutral-800 p-4">
          <button
            onClick={() => setIsAddOpen(true)}
            className="w-full rounded-md bg-blue-700 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            + Add Project
          </button>
          <button
            onClick={() => importKimiProjects()}
            className="w-full rounded-md border border-neutral-700 bg-neutral-800 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
          >
            Import from Kimi
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top content: center + right panel */}
        <div className="flex flex-1 flex-row overflow-hidden">
          {/* Center: project detail + terminal */}
          <div className="flex flex-1 flex-col overflow-hidden">
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
            <div className="h-56 shrink-0">
              <Terminal ref={terminalRef} project={selectedProject} />
            </div>
          </div>

          {/* Right panel */}
          <div className="w-72 flex-shrink-0 overflow-hidden">
            <RightPanel project={selectedProject} sessions={sessions} />
          </div>
        </div>

        {/* Bottom command input */}
        <div className="h-14 shrink-0">
          <CommandInput
            onSubmit={handleCommandSubmit}
            disabled={!selectedProject}
            placeholder="输入命令发送到终端..."
          />
        </div>
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
      {error && <Toast message={error} onClose={clearError} />}
    </div>
  );
}

export default App;
