use futures_util::StreamExt;
use reqwest::Client;
use std::collections::HashSet;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, State};

pub struct CacheState {
    pub downloading: Arc<Mutex<HashSet<String>>>,
}

impl CacheState {
    pub fn new() -> Self {
        Self {
            downloading: Arc::new(Mutex::new(HashSet::new())),
        }
    }
}

fn get_cache_dir(app: &AppHandle) -> Option<PathBuf> {
    app.path().app_cache_dir().ok().map(|mut p| {
        p.push("audio_cache");
        let _ = std::fs::create_dir_all(&p);
        p
    })
}

fn get_cache_file_path(app: &AppHandle, song_id: i64, level: &str, ext: &str) -> Option<PathBuf> {
    let mut dir = get_cache_dir(app)?;
    dir.push(format!("{}_{}.{}", song_id, level, ext));
    Some(dir)
}

fn extract_ext(url: &str) -> String {
    let path = url.split('?').next().unwrap_or(url);
    if let Some(ext) = path.rsplit('.').next() {
        if ["mp3", "flac", "m4a", "wav", "ogg", "aac"].contains(&ext.to_lowercase().as_str()) {
            return ext.to_lowercase();
        }
    }
    "mp3".to_string()
}

#[tauri::command]
pub fn check_audio_cache(
    app: AppHandle,
    state: State<'_, CacheState>,
    song_id: i64,
    level: String,
    url: String,
) -> Option<String> {
    let ext = extract_ext(&url);
    if let Some(path) = get_cache_file_path(&app, song_id, &level, &ext) {
        if path.exists() {
            let key = format!("{}_{}", song_id, level);
            if state.downloading.lock().unwrap().contains(&key) {
                return None;
            }
            return Some(path.to_string_lossy().to_string());
        }
    }
    None
}

#[tauri::command]
pub async fn cache_audio(
    app: AppHandle,
    state: State<'_, CacheState>,
    song_id: i64,
    level: String,
    url: String,
) -> Result<(), String> {
    let key = format!("{}_{}", song_id, level);

    {
        let mut downloading = state.downloading.lock().unwrap();
        if downloading.contains(&key) {
            return Ok(());
        }
        downloading.insert(key.clone());
    }

    let result: Result<(), String> = async {
        let ext = extract_ext(&url);
        let path = get_cache_file_path(&app, song_id, &level, &ext).ok_or("No cache dir")?;

        if path.exists() {
            return Ok(());
        }

        let temp_path = path.with_extension("tmp");

        let client = Client::new();
        let res = client.get(&url).send().await.map_err(|e| e.to_string())?;

        if !res.status().is_success() {
            return Err("Failed to download".to_string());
        }

        let mut file = File::create(&temp_path).map_err(|e| e.to_string())?;
        let mut stream = res.bytes_stream();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| e.to_string())?;
            file.write_all(&chunk).map_err(|e| e.to_string())?;
        }

        std::fs::rename(temp_path, path).map_err(|e| e.to_string())?;
        Ok(())
    }
    .await;

    state.downloading.lock().unwrap().remove(&key);
    result
}

#[tauri::command]
pub fn get_audio_cache_size(app: AppHandle) -> Result<u64, String> {
    let dir = get_cache_dir(&app).ok_or("No cache dir")?;
    let mut total_size = 0;

    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_file() {
                    total_size += metadata.len();
                }
            }
        }
    }

    Ok(total_size)
}

#[tauri::command]
pub fn clear_audio_cache(app: AppHandle) -> Result<(), String> {
    let dir = get_cache_dir(&app).ok_or("No cache dir")?;

    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_file() {
                    let _ = std::fs::remove_file(entry.path());
                }
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub fn enforce_cache_limit(app: AppHandle, max_bytes: u64) -> Result<(), String> {
    let dir = get_cache_dir(&app).ok_or("No cache dir")?;
    let mut files = Vec::new();

    if let Ok(entries) = std::fs::read_dir(&dir) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_file() {
                    files.push((
                        entry.path(),
                        metadata.len(),
                        metadata
                            .accessed()
                            .unwrap_or(std::time::SystemTime::UNIX_EPOCH),
                    ));
                }
            }
        }
    }

    // Sort by access time ascending (oldest first)
    files.sort_by(|a, b| a.2.cmp(&b.2));

    let mut current_size: u64 = files.iter().map(|(_, size, _)| size).sum();

    for (path, size, _) in files {
        if current_size <= max_bytes {
            break;
        }
        if std::fs::remove_file(path).is_ok() {
            current_size = current_size.saturating_sub(size);
        }
    }

    Ok(())
}
