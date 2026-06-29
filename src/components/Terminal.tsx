import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import '@xterm/xterm/css/xterm.css';
import type { Project } from '../types';

export interface TerminalHandle {
  sendCommand: (command: string) => void;
  focus: () => void;
}

interface TerminalProps {
  project: Project | null;
}

// Catppuccin Mocha-inspired palette for a modern terminal look
const TERMINAL_THEME = {
  background: '#0c0c0e',
  foreground: '#cdd6f4',
  cursor: '#f5e0dc',
  black: '#11111b',
  brightBlack: '#585b70',
  red: '#f38ba8',
  brightRed: '#f38ba8',
  green: '#a6e3a1',
  brightGreen: '#a6e3a1',
  yellow: '#f9e2af',
  brightYellow: '#f9e2af',
  blue: '#89b4fa',
  brightBlue: '#89b4fa',
  magenta: '#cba6f7',
  brightMagenta: '#cba6f7',
  cyan: '#94e2d5',
  brightCyan: '#94e2d5',
  white: '#cdd6f4',
  brightWhite: '#ffffff',
};

export const Terminal = forwardRef<TerminalHandle, TerminalProps>(
  ({ project }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const webglAddonRef = useRef<WebglAddon | null>(null);
    const sessionIdRef = useRef<string | null>(null);
    const unlistenRef = useRef<UnlistenFn | null>(null);

    useImperativeHandle(ref, () => ({
      sendCommand: (command: string) => {
        const sessionId = sessionIdRef.current;
        const term = terminalRef.current;
        if (!sessionId || !term) return;
        term.write(command);
        term.write('\r');
        invoke('write_terminal', { sessionId, data: command + '\r' }).catch(
          (err) => {
            term.writeln(`\r\n[write error: ${err}]`);
          }
        );
      },
      focus: () => {
        terminalRef.current?.focus();
      },
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      const term = new XTerm({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace',
        fontWeight: 400,
        fontWeightBold: 700,
        lineHeight: 1.2,
        theme: TERMINAL_THEME,
        scrollback: 10000,
        allowProposedApi: true,
      });
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      try {
        const webglAddon = new WebglAddon();
        term.loadAddon(webglAddon);
        webglAddonRef.current = webglAddon;
      } catch {
        // Fall back to DOM renderer if WebGL is unavailable
      }

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
          const rows = term.rows;
          const cols = term.cols;
          if (rows && cols) {
            invoke('resize_terminal', { sessionId, rows, cols }).catch(() => {});
          }
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        onDataDisposable.dispose();
        webglAddonRef.current?.dispose();
        webglAddonRef.current = null;
        term.dispose();
        terminalRef.current = null;
        fitAddonRef.current = null;
      };
    }, []);

    useEffect(() => {
      let mounted = true;

      async function setupSession() {
        if (!terminalRef.current) return;

        if (sessionIdRef.current) {
          try {
            await invoke('stop_terminal', { sessionId: sessionIdRef.current });
          } catch {
            // ignore
          }
          sessionIdRef.current = null;
        }

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
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-800 bg-[#0c0c0e] shadow-2xl">
        {/* Tab bar / title bar */}
        <div className="flex items-center gap-2 border-b border-neutral-800 bg-neutral-900/80 px-3 py-2 backdrop-blur">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="ml-3 flex items-center gap-2 rounded-md bg-neutral-950 px-3 py-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5 text-blue-400"
            >
              <path
                fillRule="evenodd"
                d="M2.232 12.207a.75.75 0 011.06.025l3.958 4.146V3.704a.75.75 0 011.5 0v12.674l3.958-4.146a.75.75 0 011.085 1.036l-5.25 5.5a.75.75 0 01-1.085 0l-5.25-5.5a.75.75 0 01.025-1.06z"
                clipRule="evenodd"
              />
            </svg>
            <span className="max-w-md truncate text-xs font-medium text-neutral-300">
              {project ? project.name : 'No project selected'}
            </span>
          </div>
          {project && (
            <span className="ml-auto truncate text-xs text-neutral-500" title={project.path}>
              {project.path}
            </span>
          )}
        </div>

        {/* Terminal surface */}
        <div ref={containerRef} className="flex-1 overflow-hidden p-3" />
      </div>
    );
  }
);

Terminal.displayName = 'Terminal';
