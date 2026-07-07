use futures_util::StreamExt;
use reqwest::Client;
use std::collections::HashSet;
use std::fs::File;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::{
    atomic::{AtomicU64, Ordering},
    Arc, Mutex,
};
use tauri::{AppHandle, Manager, State};

pub struct CacheState {
    pub downloading: Arc<Mutex<HashSet<String>>>,
}

const UNSET_CACHE_LIMIT_BYTES: u64 = u64::MAX;
static AUDIO_CACHE_LIMIT_BYTES: AtomicU64 = AtomicU64::new(UNSET_CACHE_LIMIT_BYTES);

struct CacheFile {
    path: PathBuf,
    size: u64,
    accessed: std::time::SystemTime,
}

impl CacheState {
    pub fn new() -> Self {
        Self {
            downloading: Arc::new(Mutex::new(HashSet::new())),
        }
    }
}

fn get_named_cache_dir(app: &AppHandle, name: &str) -> Option<PathBuf> {
    app.path().app_cache_dir().ok().map(|mut p| {
        p.push(name);
        p
    })
}

fn get_cache_dir(app: &AppHandle) -> Option<PathBuf> {
    get_named_cache_dir(app, "audio_cache").map(|p| {
        let _ = std::fs::create_dir_all(&p);
        p
    })
}

fn get_native_cache_dir(app: &AppHandle) -> Option<PathBuf> {
    get_named_cache_dir(app, "native_audio")
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

fn collect_cache_files(dir: PathBuf, label: &str) -> Result<Vec<CacheFile>, String> {
    if !dir.exists() {
        return Ok(Vec::new());
    }

    let entries = std::fs::read_dir(&dir).map_err(|err| format!("read {label} failed: {err}"))?;
    let mut files = Vec::new();

    for entry in entries.flatten() {
        let path = entry.path();
        let Ok(metadata) = entry.metadata() else {
            continue;
        };
        if metadata.is_file() {
            files.push(CacheFile {
                path,
                size: metadata.len(),
                accessed: metadata
                    .accessed()
                    .or_else(|_| metadata.modified())
                    .unwrap_or(std::time::SystemTime::UNIX_EPOCH),
            });
        }
    }

    Ok(files)
}

fn legacy_audio_cache_files(app: &AppHandle) -> Result<Vec<CacheFile>, String> {
    let dir = get_cache_dir(app).ok_or("No cache dir")?;
    collect_cache_files(dir, "audio cache")
}

fn all_audio_cache_files(app: &AppHandle) -> Result<Vec<CacheFile>, String> {
    let mut files = legacy_audio_cache_files(app)?;

    if let Some(dir) = get_native_cache_dir(app) {
        files.extend(collect_cache_files(dir, "native audio cache")?);
    }

    Ok(files)
}

fn enforce_files_limit(mut files: Vec<CacheFile>, max_bytes: u64, preserve_path: Option<&Path>) {
    files.sort_by(|a, b| a.accessed.cmp(&b.accessed));

    let mut current_size: u64 = files.iter().map(|file| file.size).sum();

    for file in files {
        if current_size <= max_bytes {
            break;
        }
        if preserve_path.is_some_and(|path| file.path.as_path() == path) {
            continue;
        }
        if std::fs::remove_file(file.path).is_ok() {
            current_size = current_size.saturating_sub(file.size);
        }
    }
}

fn enforce_audio_cache_limit_impl(
    app: &AppHandle,
    max_bytes: u64,
    preserve_path: Option<&Path>,
) -> Result<(), String> {
    enforce_files_limit(all_audio_cache_files(app)?, max_bytes, preserve_path);
    Ok(())
}

pub(crate) fn enforce_configured_audio_cache_limit_excluding(
    app: &AppHandle,
    preserve_path: &Path,
) -> Result<(), String> {
    let max_bytes = AUDIO_CACHE_LIMIT_BYTES.load(Ordering::Relaxed);
    if max_bytes == UNSET_CACHE_LIMIT_BYTES {
        return Ok(());
    }

    enforce_audio_cache_limit_impl(app, max_bytes, Some(preserve_path))
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

        std::fs::rename(temp_path, &path).map_err(|e| e.to_string())?;
        enforce_configured_audio_cache_limit_excluding(&app, &path)?;
        Ok(())
    }
    .await;

    state.downloading.lock().unwrap().remove(&key);
    result
}

#[tauri::command]
pub fn get_audio_cache_size(app: AppHandle) -> Result<u64, String> {
    Ok(legacy_audio_cache_files(&app)?
        .iter()
        .map(|file| file.size)
        .sum())
}

#[tauri::command]
pub fn clear_audio_cache(app: AppHandle) -> Result<(), String> {
    for file in legacy_audio_cache_files(&app)? {
        let _ = std::fs::remove_file(file.path);
    }

    Ok(())
}

#[tauri::command]
pub fn enforce_cache_limit(app: AppHandle, max_bytes: u64) -> Result<(), String> {
    enforce_files_limit(legacy_audio_cache_files(&app)?, max_bytes, None);

    Ok(())
}

#[tauri::command]
pub fn enforce_audio_cache_limit(app: AppHandle, max_bytes: u64) -> Result<(), String> {
    enforce_audio_cache_limit_impl(&app, max_bytes, None)
}

#[tauri::command]
pub fn set_audio_cache_limit(app: AppHandle, max_bytes: u64) -> Result<(), String> {
    AUDIO_CACHE_LIMIT_BYTES.store(max_bytes, Ordering::Relaxed);
    enforce_audio_cache_limit_impl(&app, max_bytes, None)
}
