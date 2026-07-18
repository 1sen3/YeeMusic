use lofty::file::AudioFile;
use lofty::file::TaggedFileExt;
use lofty::picture::MimeType;
use lofty::probe::Probe;
use lofty::tag::Accessor;
use serde::Serialize;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};
use tauri::Manager;
use walkdir::WalkDir;

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LocalTrack {
    pub file_path: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration_secs: f64,
    pub cover_art_path: Option<String>,
}

const AUDIO_EXTENSIONS: &[&str] = &["mp3", "flac", "wav", "ogg", "aac"];

#[tauri::command]
pub fn scan_local_music(app: tauri::AppHandle, dir: String) -> Result<Vec<LocalTrack>, String> {
    let path = Path::new(&dir);
    if !path.exists() || !path.is_dir() {
        return Err(format!("[LocalMusicScanner] 目录不存在: {}", dir));
    }

    let covers_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("[LocalMusicScanner] 无法获取应用数据目录: {}", e))?
        .join("covers");
    std::fs::create_dir_all(&covers_dir)
        .map_err(|e| format!("[LocalMusicScanner] 无法创建封面缓存目录: {}", e))?;

    let mut tracks = Vec::new();

    for entry in WalkDir::new(path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let file_path = entry.path();

        if !file_path.is_file() {
            continue;
        }

        let ext = file_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        if !AUDIO_EXTENSIONS.contains(&ext.as_str()) {
            continue;
        }

        match read_track_metadata(file_path, &covers_dir) {
            Ok(track) => tracks.push(track),
            Err(e) => {
                eprintln!("[LocalMusicScanner] 跳过文件: {:?}: {}", file_path, e);
            }
        }
    }

    Ok(tracks)
}

/// 将封面图片按内容哈希写入缓存目录（同专辑的重复封面只落盘一份），返回文件路径
fn save_cover_art(covers_dir: &Path, data: &[u8], mime_type: Option<&MimeType>) -> Option<PathBuf> {
    if data.is_empty() {
        return None;
    }

    let mut hasher = DefaultHasher::new();
    data.hash(&mut hasher);
    let ext = match mime_type {
        Some(MimeType::Png) => "png",
        _ => "jpg",
    };
    let file_path = covers_dir.join(format!("{:016x}.{}", hasher.finish(), ext));

    if !file_path.exists() {
        std::fs::write(&file_path, data).ok()?;
    }
    Some(file_path)
}

fn read_track_metadata(path: &Path, covers_dir: &Path) -> Result<LocalTrack, String> {
    let tagged_file = Probe::open(path)
        .map_err(|e| e.to_string())?
        .read()
        .map_err(|e| e.to_string())?;

    // 获取主标签
    let tag: Option<&lofty::tag::Tag> = tagged_file.primary_tag().or(tagged_file.first_tag());

    let title = tag
        .and_then(|t| t.title().map(|s| s.to_string()))
        .unwrap_or_else(|| {
            path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("未知歌曲")
                .to_string()
        });

    let artist = tag
        .and_then(|t| t.artist().map(|s| s.to_string()))
        .unwrap_or_else(|| "未知艺术家".to_string());

    let album = tag
        .and_then(|t| t.album().map(|s| s.to_string()))
        .unwrap_or_else(|| "未知专辑".to_string());

    let duration_secs = tagged_file.properties().duration().as_secs_f64();

    let cover_art_path = tag
        .and_then(|t| t.pictures().first())
        .and_then(|pic| save_cover_art(covers_dir, pic.data(), pic.mime_type()))
        .map(|p| p.to_string_lossy().to_string());

    Ok(LocalTrack {
        file_path: path.to_string_lossy().to_string(),
        title,
        artist,
        album,
        duration_secs,
        cover_art_path,
    })
}

#[tauri::command]
pub fn get_default_music_dir() -> Result<String, String> {
    let music_dir = dirs::audio_dir().ok_or_else(|| "无法获取用户音乐目录".to_string())?;
    Ok(music_dir.to_str().unwrap().to_string())
}
