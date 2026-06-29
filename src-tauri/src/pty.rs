use portable_pty::{MasterPty, NativePtySystem, PtySize, PtySystem};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use std::thread;

pub struct PtySession {
    master: Box<dyn MasterPty + Send>,
}

pub struct PtyManager {
    sessions: Arc<Mutex<HashMap<String, PtySession>>>,
    pty_system: Box<dyn PtySystem + Send + Sync>,
}

impl PtyManager {
    pub fn new() -> Result<Self, String> {
        let pty_system = Box::new(NativePtySystem::default());
        Ok(Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
            pty_system,
        })
    }

    pub fn start(
        &self,
        session_id: String,
        cwd: String,
        on_output: impl Fn(String) + Send + 'static,
    ) -> Result<(), String> {
        let pair = self
            .pty_system
            .openpty(PtySize {
                rows: 24,
                cols: 80,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())?;

        let mut cmd = if cfg!(target_os = "windows") {
            let mut c = portable_pty::CommandBuilder::new("cmd.exe");
            c.arg("/k");
            c.arg(format!("cd /d {}", cwd));
            c
        } else {
            let mut c = portable_pty::CommandBuilder::new("bash");
            c.arg("-l");
            c.env("PWD", &cwd);
            c
        };
        cmd.cwd(cwd);

        let mut child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
        let master = pair.master;
        drop(pair.slave);

        let mut reader = master.try_clone_reader().map_err(|e| e.to_string())?;
        let sessions = self.sessions.clone();
        let session_id_for_thread = session_id.clone();

        thread::spawn(move || {
            let mut buf = [0u8; 1024];
            loop {
                match reader.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => {
                        let text = String::from_utf8_lossy(&buf[..n]).to_string();
                        on_output(text);
                    }
                    Err(_) => break,
                }
            }
            let _ = child.wait();
            sessions.lock().unwrap().remove(&session_id_for_thread);
        });

        self.sessions
            .lock()
            .unwrap()
            .insert(session_id, PtySession { master });

        Ok(())
    }

    pub fn write(&self, session_id: &str, data: &str) -> Result<(), String> {
        let sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        let session = sessions
            .get(session_id)
            .ok_or_else(|| "terminal session not found".to_string())?;
        let mut writer = session.master.take_writer().map_err(|e| e.to_string())?;
        writer
            .write_all(data.as_bytes())
            .map_err(|e| e.to_string())?;
        writer.flush().map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn resize(&self, session_id: &str, rows: u16, cols: u16) -> Result<(), String> {
        let sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        let session = sessions
            .get(session_id)
            .ok_or_else(|| "terminal session not found".to_string())?;
        session
            .master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())
    }

    pub fn stop(&self, session_id: &str) -> Result<(), String> {
        let mut sessions = self.sessions.lock().map_err(|e| e.to_string())?;
        sessions.remove(session_id);
        Ok(())
    }
}

impl Default for PtyManager {
    fn default() -> Self {
        Self::new().expect("failed to create pty manager")
    }
}
