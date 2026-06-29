import type { Project, Session } from '../types';

interface RightPanelProps {
  project: Project | null;
  sessions: Session[];
  onOpenKimi?: () => void;
  onEdit?: () => void;
}

export function RightPanel({ project, sessions, onOpenKimi, onEdit }: RightPanelProps) {
  const projectSessions = project
    ? sessions.filter((s) => s.projectId === project.id).slice(-10).reverse()
    : [];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-neutral-900">
      <div className="border-b border-neutral-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-neutral-200">环境信息</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!project ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-neutral-500">选择一个项目以查看详情</p>
          </div>
        ) : (
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                项目
              </h3>
              <div className="rounded-xl border border-neutral-800 bg-[#0c0c0e] p-4">
                <p className="text-base font-semibold text-neutral-100">{project.name}</p>
                <p className="mt-1 break-all text-xs text-neutral-500" title={project.path}>
                  {project.path}
                </p>
                {project.description && (
                  <p className="mt-3 text-sm leading-relaxed text-neutral-400">
                    {project.description}
                  </p>
                )}
                {project.tags && project.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-2">
              <button
                onClick={onOpenKimi}
                className="rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
              >
                在 Kimi 中打开
              </button>
              <button
                onClick={onEdit}
                className="rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm font-medium text-neutral-200 hover:bg-neutral-700"
              >
                编辑项目
              </button>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                最近会话
              </h3>
              {projectSessions.length === 0 ? (
                <p className="text-sm text-neutral-500">暂无会话记录。</p>
              ) : (
                <ul className="space-y-2">
                  {projectSessions.map((session) => (
                    <li
                      key={session.id}
                      className="rounded-xl border border-neutral-800 bg-[#0c0c0e] p-3"
                    >
                      <p className="text-xs text-neutral-300">
                        {new Date(session.startedAt).toLocaleString('zh-CN')}
                      </p>
                      {session.command && (
                        <p className="mt-1 font-mono text-xs text-neutral-500">
                          {session.command}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                工具
              </h3>
              <div className="space-y-1.5">
                <button
                  onClick={() => project && navigator.clipboard.writeText(project.path)}
                  className="w-full rounded-lg border border-neutral-800 bg-[#0c0c0e] px-3 py-2 text-left text-xs text-neutral-400 hover:bg-neutral-800"
                >
                  复制项目路径
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
