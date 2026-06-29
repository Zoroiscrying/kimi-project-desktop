import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import '@xterm/xterm/css/xterm.css';
import type { Project } from '../types';

interface TerminalProps {
  project: Project | null;
}

export function Terminal({ project }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const unlistenRef = useRef<UnlistenFn | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#171717',
        foreground: '#e5e5e5',
        cursor: '#e5e5e5',
      },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    const onDataDisposable = term.onData((data) => {
      const sessionId = sessionIdRef.current;
      if (sessionId) {
        invoke('write_terminal', { sessionId, data }).catch((err) => {
          term.writeln(`\r\n[write error: ${err}]`);
        });
      }
    });

    const handleResize = () => {
      fitAddon.fit();
      const sessionId = sessionIdRef.current;
      if (sessionId) {
        const dims = term.rows && term.cols ? { rows: term.rows, cols: term.cols } : null;
        if (dims) {
          invoke('resize_terminal', { sessionId, rows: dims.rows, cols: dims.cols }).catch(() => {});
        }
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      onDataDisposable.dispose();
      term.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function setupSession() {
      if (!terminalRef.current) return;

      // Stop previous session if any
      if (sessionIdRef.current) {
        try {
          await invoke('stop_terminal', { sessionId: sessionIdRef.current });
        } catch {
          // ignore
        }
        sessionIdRef.current = null;
      }

      // Unlisten previous event listener
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }

      terminalRef.current.clear();

      if (!project) {
        terminalRef.current.writeln('Select a project to open an embedded terminal.');
        return;
      }

      const sessionId = `term-${project.id}`;
      sessionIdRef.current = sessionId;

      const unlisten = await listen<{ data: string }>('terminal-output', (event) => {
        if (!mounted) return;
        if (event.payload.data && sessionIdRef.current === sessionId && terminalRef.current) {
          terminalRef.current.write(event.payload.data);
        }
      });
      unlistenRef.current = unlisten;

      try {
        await invoke('start_terminal', { sessionId, cwd: project.path });
      } catch (err) {
        terminalRef.current.writeln(`\r\n[failed to start terminal: ${err}]`);
      }

      // Initial resize
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
        const rows = terminalRef.current.rows;
        const cols = terminalRef.current.cols;
        if (rows && cols) {
          invoke('resize_terminal', { sessionId, rows, cols }).catch(() => {});
        }
      }
    }

    setupSession();

    return () => {
      mounted = false;
      if (sessionIdRef.current) {
        invoke('stop_terminal', { sessionId: sessionIdRef.current }).catch(() => {});
        sessionIdRef.current = null;
      }
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    };
  }, [project]);

  return (
    <div className="flex h-full flex-col border-t border-neutral-800 bg-neutral-950">
      <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-1.5">
        <span className="text-xs font-medium text-neutral-400">Terminal</span>
        {project && (
          <span className="truncate text-xs text-neutral-500" title={project.path}>
            {project.path}
          </span>
        )}
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden p-2" />
    </div>
  );
}
