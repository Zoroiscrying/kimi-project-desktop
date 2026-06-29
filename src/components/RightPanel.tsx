import type { Project, Session } from '../types';

interface RightPanelProps {
  project: Project | null;
  sessions: Session[];
}

export function RightPanel({ project, sessions }: RightPanelProps) {
  const projectSessions = project
    ? sessions.filter((s) => s.projectId === project.id).slice(-10).reverse()
    : [];

  return (
    <div className="flex h-full flex-col border-l border-neutral-800 bg-neutral-900">
      <div className="border-b border-neutral-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-neutral-200">环境信息</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!project ? (
          <p className="text-sm text-neutral-500">选择一个项目以查看详情。</p>
        ) : (
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                项目
              </h3>
              <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3">
                <p className="text-sm font-medium text-neutral-200">{project.name}</p>
                <p className="mt-1 break-all text-xs text-neutral-500" title={project.path}>
                  {project.path}
                </p>
                {project.description && (
                  <p className="mt-2 text-xs text-neutral-400">{project.description}</p>
                )}
                {project.tags && project.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
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
                      className="rounded-lg border border-neutral-800 bg-neutral-950 p-2.5"
                    >
                      <p className="text-xs text-neutral-300">
                        {new Date(session.startedAt).toLocaleString('zh-CN')}
                      </p>
                      {session.command && (
                        <p className="mt-0.5 font-mono text-xs text-neutral-500">
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
                <button className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-left text-xs text-neutral-400 hover:bg-neutral-900">
                  在资源管理器中打开
                </button>
                <button className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-left text-xs text-neutral-400 hover:bg-neutral-900">
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
