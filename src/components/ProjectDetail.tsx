import type { Project, Session } from '../types';

interface ProjectDetailProps {
  project: Project;
  sessions: Session[];
  onOpenKimi: () => void;
  onEdit: () => void;
}

export function ProjectDetail({ project, sessions, onOpenKimi, onEdit }: ProjectDetailProps) {
  const projectSessions = sessions
    .filter((s) => s.projectId === project.id)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  return (
    <div className="flex h-full flex-col bg-neutral-950 p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-100">{project.name}</h2>
          <p className="mt-1 text-sm text-neutral-500">{project.path}</p>
          {project.description && <p className="mt-2 text-neutral-400">{project.description}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="rounded-md bg-neutral-800 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-700"
          >
            Edit
          </button>
          <button
            onClick={onOpenKimi}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            Open in Kimi
          </button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Recent Sessions
        </h3>
        {projectSessions.length === 0 ? (
          <p className="text-neutral-600">No sessions yet.</p>
        ) : (
          <div className="space-y-2">
            {projectSessions.map((session) => (
              <div key={session.id} className="rounded-md bg-neutral-900 p-3">
                <div className="text-sm text-neutral-300">
                  {new Date(session.startedAt).toLocaleString()}
                </div>
                {session.summary && (
                  <div className="mt-1 text-xs text-neutral-500">{session.summary}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
