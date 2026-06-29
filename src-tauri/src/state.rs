use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub id: String,
    pub project_id: String,
    pub started_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub command: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub launch_on_startup: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub global_shortcut: Option<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            launch_on_startup: Some(false),
            global_shortcut: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppState {
    pub version: u32,
    pub projects: Vec<Project>,
    pub sessions: Vec<Session>,
    pub settings: AppSettings,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            version: 1,
            projects: vec![],
            sessions: vec![],
            settings: AppSettings::default(),
        }
    }
}

pub fn load_or_create<P: AsRef<Path>>(path: P) -> Result<AppState, String> {
    let path = path.as_ref();
    if !path.exists() {
        let default = AppState::default();
        save_state(path, &default)?;
        return Ok(default);
    }

    let content = fs::read_to_string(path).map_err(|e| format!("read failed: {e}"))?;
    match serde_json::from_str::<AppState>(&content) {
        Ok(state) => Ok(state),
        Err(e) => {
            let backup_name = format!(
                "state.json.bak.{}",
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_nanos()
            );
            let backup_path = path.with_file_name(&backup_name);
            fs::copy(path, backup_path).map_err(|err| format!("backup failed: {err}"))?;
            let default = AppState::default();
            save_state(path, &default)?;
            eprintln!("State file corrupted, backed up to {backup_name}: {e}");
            Ok(default)
        }
    }
}

pub fn save_state<P: AsRef<Path>>(path: P, state: &AppState) -> Result<(), String> {
    let path = path.as_ref();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("create dir failed: {e}"))?;
    }
    let content = serde_json::to_string_pretty(state).map_err(|e| format!("serialize failed: {e}"))?;
    let mut file = fs::File::create(path).map_err(|e| format!("create file failed: {e}"))?;
    file.write_all(content.as_bytes())
        .map_err(|e| format!("write failed: {e}"))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    #[test]
    fn test_load_or_create_creates_default_when_missing() {
        let dir = tempfile::tempdir().unwrap();
        let path: PathBuf = dir.path().join("state.json");
        assert!(!path.exists());

        let state = load_or_create(&path).unwrap();
        assert_eq!(state, AppState::default());
        assert!(path.exists());

        let loaded = load_or_create(&path).unwrap();
        assert_eq!(loaded, AppState::default());
    }

    #[test]
    fn test_save_and_load_roundtrip() {
        let dir = tempfile::tempdir().unwrap();
        let path: PathBuf = dir.path().join("state.json");

        let mut state = AppState::default();
        state.projects.push(Project {
            id: "p1".to_string(),
            name: "demo".to_string(),
            path: "/tmp/demo".to_string(),
            description: None,
            tags: None,
            created_at: "2026-06-29T00:00:00Z".to_string(),
            updated_at: "2026-06-29T00:00:00Z".to_string(),
        });

        save_state(&path, &state).unwrap();
        let loaded = load_or_create(&path).unwrap();
        assert_eq!(loaded, state);
    }

    #[test]
    fn test_load_or_create_backups_corrupted_file() {
        let dir = tempfile::tempdir().unwrap();
        let path: PathBuf = dir.path().join("state.json");
        fs::write(&path, "not json").unwrap();

        let state = load_or_create(&path).unwrap();
        assert_eq!(state, AppState::default());

        let backups: Vec<_> = fs::read_dir(dir.path())
            .unwrap()
            .filter_map(|e| e.ok())
            .map(|e| e.file_name().to_string_lossy().to_string())
            .filter(|n| n.starts_with("state.json.bak"))
            .collect();
        assert_eq!(backups.len(), 1);

        let loaded = load_or_create(&path).unwrap();
        assert_eq!(loaded, AppState::default());
    }
}
