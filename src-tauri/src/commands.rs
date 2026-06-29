use crate::state::{AppState, Project, Session};
use std::sync::Mutex;
use tauri::State;

pub struct AppStateWrapper(pub Mutex<AppState>);

#[tauri::command]
pub fn get_state(state: State<'_, AppStateWrapper>) -> Result<AppState, String> {
    let guard = state.0.lock().map_err(|e| e.to_string())?;
    Ok(guard.clone())
}

#[tauri::command]
pub fn add_project(
    state: State<'_, AppStateWrapper>,
    project: Project,
    state_path: String,
) -> Result<AppState, String> {
    {
        let mut guard = state.0.lock().map_err(|e| e.to_string())?;
        guard.projects.push(project);
        crate::state::save_state(&state_path, &guard)?;
    }
    get_state(state)
}

#[tauri::command]
pub fn update_project(
    state: State<'_, AppStateWrapper>,
    project: Project,
    state_path: String,
) -> Result<AppState, String> {
    {
        let mut guard = state.0.lock().map_err(|e| e.to_string())?;
        if let Some(existing) = guard.projects.iter_mut().find(|p| p.id == project.id) {
            *existing = project;
            crate::state::save_state(&state_path, &guard)?;
        }
    }
    get_state(state)
}

#[tauri::command]
pub fn delete_project(
    state: State<'_, AppStateWrapper>,
    id: String,
    state_path: String,
) -> Result<AppState, String> {
    {
        let mut guard = state.0.lock().map_err(|e| e.to_string())?;
        guard.projects.retain(|p| p.id != id);
        guard.sessions.retain(|s| s.project_id != id);
        crate::state::save_state(&state_path, &guard)?;
    }
    get_state(state)
}

#[tauri::command]
pub fn record_session(
    state: State<'_, AppStateWrapper>,
    session: Session,
    state_path: String,
) -> Result<AppState, String> {
    {
        let mut guard = state.0.lock().map_err(|e| e.to_string())?;
        guard.sessions.push(session);
        crate::state::save_state(&state_path, &guard)?;
    }
    get_state(state)
}
