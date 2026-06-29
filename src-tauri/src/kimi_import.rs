use serde_json;
use std::collections::HashSet;
use std::path::PathBuf;

pub fn parse_kimi_work_dirs(content: &str, kimi_dir: &PathBuf) -> HashSet<PathBuf> {
    let mut work_dirs: HashSet<PathBuf> = HashSet::new();

    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let entry: serde_json::Value = match serde_json::from_str(line) {
            Ok(v) => v,
            Err(_) => continue,
        };
        if let Some(work_dir) = entry.get("workDir").and_then(|v| v.as_str()) {
            let path = PathBuf::from(work_dir);
            if path.starts_with(kimi_dir) {
                continue;
            }
            if !path.exists() || !path.is_dir() {
                continue;
            }
            work_dirs.insert(path);
        }
    }

    work_dirs
}

/// Find the most recent Kimi session ID whose workDir matches the target path.
/// Session index is append-only, so the last matching line is the most recent.
pub fn find_latest_kimi_session(content: &str, target_path: &str) -> Option<String> {
    let target = normalize_path(target_path);
    let mut latest: Option<String> = None;

    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let entry: serde_json::Value = match serde_json::from_str(line) {
            Ok(v) => v,
            Err(_) => continue,
        };
        let Some(work_dir) = entry.get("workDir").and_then(|v| v.as_str()) else {
            continue;
        };
        if normalize_path(work_dir) == target {
            if let Some(session_id) = entry.get("sessionId").and_then(|v| v.as_str()) {
                latest = Some(session_id.to_string());
            }
        }
    }

    latest
}

fn normalize_path(path: &str) -> String {
    path.replace('\\', "/").to_lowercase()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_parse_kimi_work_dirs_filters_and_deduplicates() {
        let tmp = TempDir::new().unwrap();
        let kimi_dir = tmp.path().join(".kimi-code");
        let real_project = tmp.path().join("real-project");
        let another_project = tmp.path().join("another-project");
        fs::create_dir(&real_project).unwrap();
        fs::create_dir(&another_project).unwrap();
        fs::create_dir(&kimi_dir).unwrap();
        fs::create_dir(kimi_dir.join("internal")).unwrap();

        let content = format!(
            "{{\"workDir\":\"{}\"}}\n{{\"workDir\":\"{}\"}}\n{{\"workDir\":\"{}\"}}\n{{\"workDir\":\"{}\"}}\n",
            real_project.to_string_lossy().replace('\\', "/"),
            real_project.to_string_lossy().replace('\\', "/"),
            another_project.to_string_lossy().replace('\\', "/"),
            kimi_dir.join("internal").to_string_lossy().replace('\\', "/")
        );

        let dirs = parse_kimi_work_dirs(&content, &kimi_dir);
        assert_eq!(dirs.len(), 2);
        assert!(dirs.contains(&real_project));
        assert!(dirs.contains(&another_project));
    }

    #[test]
    fn test_parse_kimi_work_dirs_skips_missing_directories() {
        let tmp = TempDir::new().unwrap();
        let kimi_dir = tmp.path().join(".kimi-code");
        fs::create_dir(&kimi_dir).unwrap();

        let content = "{\"workDir\":\"/nonexistent/path\"}\n".to_string();
        let dirs = parse_kimi_work_dirs(&content, &kimi_dir);
        assert!(dirs.is_empty());
    }

    #[test]
    fn test_find_latest_kimi_session_returns_most_recent_match() {
        let target = "F:/Coding-Projects/demo";
        let content = format!(
            "{{\"sessionId\":\"session-old\",\"workDir\":\"{}\"}}\n{{\"sessionId\":\"session-other\",\"workDir\":\"F:/Coding-Projects/other\"}}\n{{\"sessionId\":\"session-latest\",\"workDir\":\"{}\"}}\n",
            target.replace('/', "\\"),
            target
        );

        assert_eq!(
            find_latest_kimi_session(&content, target),
            Some("session-latest".to_string())
        );
    }

    #[test]
    fn test_find_latest_kimi_session_returns_none_when_no_match() {
        let content = "{\"sessionId\":\"session-1\",\"workDir\":\"F:/Coding-Projects/other\"}\n".to_string();
        assert!(find_latest_kimi_session(&content, "F:/Coding-Projects/demo").is_none());
    }
}
