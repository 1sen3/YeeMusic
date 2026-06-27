use super::streaming::{
    content_type, decode_streaming_reader, detect_stream_format, remote_cache_file_name,
    StreamFormat, StreamingBuffer, StreamingReader,
};
use futures_util::StreamExt;
use lofty::{
    file::TaggedFileExt,
    probe::Probe,
    tag::{ItemKey, Tag},
};
use percent_encoding::percent_decode_str;
use rodio::{Decoder, Source};
use std::{
    fs::File,
    io::{BufReader, Write},
    path::PathBuf,
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc,
    },
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager};

#[derive(Clone)]
pub(super) enum AudioSource {
    File {
        path: PathBuf,
        label: String,
        replay_gain: Option<ReplayGainInfo>,
    },
    Stream {
        reader: StreamingReader,
        format: StreamFormat,
        label: String,
        replay_gain: Option<ReplayGainInfo>,
    },
}

impl AudioSource {
    pub(super) fn label(&self) -> String {
        match self {
            AudioSource::File { label, .. } => label.clone(),
            AudioSource::Stream { label, .. } => label.clone(),
        }
    }

    pub(super) fn replay_gain(&self) -> Option<ReplayGainInfo> {
        match self {
            AudioSource::File { replay_gain, .. } => *replay_gain,
            AudioSource::Stream { replay_gain, .. } => *replay_gain,
        }
    }
}

#[derive(Clone, Copy)]
pub(super) struct ReplayGainInfo {
    pub(super) gain_db: f32,
    pub(super) peak: Option<f32>,
}

pub(super) async fn resolve_audio_source(
    app: &AppHandle,
    source: String,
    latest_request_id: Arc<AtomicU64>,
    request_id: u64,
) -> Result<Option<AudioSource>, String> {
    if is_stale_request(&latest_request_id, request_id) {
        return Ok(None);
    }

    if let Some(source) = source.strip_prefix("unblock:") {
        return resolve_remote_audio_source(app, source, latest_request_id, request_id, false)
            .await;
    }

    if source.starts_with("http://") || source.starts_with("https://") {
        return resolve_remote_audio_source(app, &source, latest_request_id, request_id, true)
            .await;
    }

    let path = decode_source_path(&source);
    if !path.exists() {
        return Err(format!("audio file does not exist: {}", path.display()));
    }

    if is_stale_request(&latest_request_id, request_id) {
        return Ok(None);
    }

    Ok(Some(AudioSource::File {
        label: path.to_string_lossy().to_string(),
        replay_gain: read_replay_gain(&path),
        path,
    }))
}

async fn resolve_remote_audio_source(
    app: &AppHandle,
    url: &str,
    latest_request_id: Arc<AtomicU64>,
    request_id: u64,
    allow_streaming: bool,
) -> Result<Option<AudioSource>, String> {
    let dir = native_audio_cache_dir(app)?;
    std::fs::create_dir_all(&dir)
        .map_err(|err| format!("create native audio cache dir failed: {err}"))?;

    let final_path = dir.join(remote_cache_file_name(url));
    if final_path.exists() && final_path.metadata().map(|m| m.len()).unwrap_or(0) > 0 {
        return Ok(Some(AudioSource::File {
            replay_gain: read_replay_gain(&final_path),
            path: final_path,
            label: url.to_string(),
        }));
    }

    if is_stale_request(&latest_request_id, request_id) {
        return Ok(None);
    }

    let response = reqwest::get(url)
        .await
        .map_err(|err| format!("request audio url failed: {err}"))?;
    if !response.status().is_success() {
        return Err(format!("request audio url returned {}", response.status()));
    }
    let content_type = content_type(response.headers());
    let mut stream = response.bytes_stream();
    let Some(first_chunk) = stream.next().await else {
        return Err("audio response was empty".to_string());
    };
    let first_chunk = first_chunk.map_err(|err| format!("read audio response failed: {err}"))?;

    let temp_path = final_path.with_extension(format!("part-{}", unique_suffix()));

    if allow_streaming {
        if let Some(stream_format) =
            detect_stream_format(url, content_type.as_deref(), &first_chunk)
        {
            let shared = StreamingBuffer::new();
            shared.append(&first_chunk)?;
            let reader = StreamingReader::new(
                Arc::clone(&shared),
                Arc::clone(&latest_request_id),
                request_id,
            );
            let first_chunk_for_file = first_chunk.clone();
            let latest_request_id_for_download = Arc::clone(&latest_request_id);

            tauri::async_runtime::spawn(async move {
                let result = async {
                    if is_stale_request(&latest_request_id_for_download, request_id) {
                        return Err("streaming audio load cancelled".to_string());
                    }

                    let mut file = File::create(&temp_path)
                        .map_err(|err| format!("create temp audio file failed: {err}"))?;
                    file.write_all(&first_chunk_for_file)
                        .map_err(|err| format!("write temp audio file failed: {err}"))?;

                    while let Some(chunk) = stream.next().await {
                        if is_stale_request(&latest_request_id_for_download, request_id) {
                            return Err("streaming audio load cancelled".to_string());
                        }

                        let chunk = chunk.map_err(|err| {
                            format!("read streaming audio response failed: {err}")
                        })?;
                        shared.append(&chunk)?;
                        file.write_all(&chunk)
                            .map_err(|err| format!("write temp audio file failed: {err}"))?;
                    }

                    file.flush()
                        .map_err(|err| format!("flush temp audio file failed: {err}"))?;
                    drop(file);

                    if let Err(err) = std::fs::rename(&temp_path, &final_path) {
                        if final_path.exists()
                            && final_path.metadata().map(|m| m.len()).unwrap_or(0) > 0
                        {
                            let _ = std::fs::remove_file(&temp_path);
                            return Ok(());
                        }
                        return Err(format!("commit temp audio file failed: {err}"));
                    }

                    Ok(())
                }
                .await;

                match result {
                    Ok(()) => shared.finish(),
                    Err(error) => {
                        let _ = std::fs::remove_file(&temp_path);
                        shared.fail(error);
                    }
                }
            });

            if let Err(err) =
                prepare_streaming_decode(reader.clone(), stream_format, url.to_string()).await
            {
                if is_stale_request(&latest_request_id, request_id) {
                    return Ok(None);
                }
                return Err(err);
            }

            if is_stale_request(&latest_request_id, request_id) {
                return Ok(None);
            }

            return Ok(Some(AudioSource::Stream {
                reader,
                format: stream_format,
                label: url.to_string(),
                replay_gain: None,
            }));
        }
    }

    let mut file =
        File::create(&temp_path).map_err(|err| format!("create temp audio file failed: {err}"))?;
    file.write_all(&first_chunk)
        .map_err(|err| format!("write temp audio file failed: {err}"))?;

    while let Some(chunk) = stream.next().await {
        if is_stale_request(&latest_request_id, request_id) {
            drop(file);
            let _ = std::fs::remove_file(&temp_path);
            return Ok(None);
        }

        let chunk = match chunk {
            Ok(chunk) => chunk,
            Err(err) => {
                let _ = std::fs::remove_file(&temp_path);
                return Err(format!("read audio response failed: {err}"));
            }
        };
        if let Err(err) = file.write_all(&chunk) {
            let _ = std::fs::remove_file(&temp_path);
            return Err(format!("write temp audio file failed: {err}"));
        }
    }

    if let Err(err) = file.flush() {
        let _ = std::fs::remove_file(&temp_path);
        return Err(format!("flush temp audio file failed: {err}"));
    }
    drop(file);

    if let Err(err) = std::fs::rename(&temp_path, &final_path) {
        if final_path.exists() && final_path.metadata().map(|m| m.len()).unwrap_or(0) > 0 {
            let _ = std::fs::remove_file(&temp_path);
            return Ok(Some(AudioSource::File {
                replay_gain: read_replay_gain(&final_path),
                path: final_path,
                label: url.to_string(),
            }));
        }
        let _ = std::fs::remove_file(&temp_path);
        return Err(format!("commit temp audio file failed: {err}"));
    }

    if is_stale_request(&latest_request_id, request_id) {
        return Ok(None);
    }

    Ok(Some(AudioSource::File {
        replay_gain: read_replay_gain(&final_path),
        path: final_path,
        label: url.to_string(),
    }))
}

pub(super) fn probe_source_duration(source: &AudioSource) -> Result<Option<Duration>, String> {
    match source {
        AudioSource::File { path, .. } => {
            let file = File::open(path).map_err(|err| {
                format!("open preload audio file {} failed: {err}", path.display())
            })?;
            let decoder = Decoder::new(BufReader::new(file)).map_err(|err| {
                format!("decode preload audio file {} failed: {err}", path.display())
            })?;
            Ok(decoder.total_duration())
        }
        AudioSource::Stream {
            reader,
            format,
            label,
            ..
        } => {
            let decoder = decode_streaming_reader(reader.clone(), *format).map_err(|err| {
                format!(
                    "decode preload streaming {} audio {label} failed: {err}",
                    format.label()
                )
            })?;
            Ok(decoder.total_duration())
        }
    }
}

async fn prepare_streaming_decode(
    reader: StreamingReader,
    format: StreamFormat,
    label: String,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        decode_streaming_reader(reader, format)
            .map(|_| ())
            .map_err(|err| {
                format!(
                    "prepare streaming {} audio {label} failed: {err}",
                    format.label()
                )
            })
    })
    .await
    .map_err(|err| format!("prepare streaming audio task failed: {err}"))?
}

fn read_replay_gain(path: &PathBuf) -> Option<ReplayGainInfo> {
    let tagged_file = Probe::open(path).ok()?.read().ok()?;
    let tag = tagged_file.primary_tag().or(tagged_file.first_tag())?;

    let gain_db = read_replay_gain_db(tag, &ItemKey::ReplayGainTrackGain)
        .or_else(|| read_replay_gain_db(tag, &ItemKey::ReplayGainAlbumGain))?;
    let peak = read_replay_gain_peak(tag, &ItemKey::ReplayGainTrackPeak)
        .or_else(|| read_replay_gain_peak(tag, &ItemKey::ReplayGainAlbumPeak));

    Some(ReplayGainInfo { gain_db, peak })
}

fn read_replay_gain_db(tag: &Tag, key: &ItemKey) -> Option<f32> {
    parse_replay_gain_number(tag.get_string(key)?)
}

fn read_replay_gain_peak(tag: &Tag, key: &ItemKey) -> Option<f32> {
    parse_replay_gain_number(tag.get_string(key)?).filter(|peak| *peak > 0.0)
}

fn parse_replay_gain_number(value: &str) -> Option<f32> {
    let mut token = String::new();
    let mut started = false;

    for ch in value.chars() {
        if ch.is_ascii_digit() || ch == '.' || ch == '-' || ch == '+' {
            token.push(ch);
            started = true;
        } else if started {
            break;
        }
    }

    token.parse::<f32>().ok().filter(|value| value.is_finite())
}

pub(super) fn native_audio_cache_size(app: &AppHandle) -> Result<u64, String> {
    Ok(native_audio_cache_files(app)?
        .iter()
        .map(|(_, size, _)| *size)
        .sum())
}

pub(super) fn clear_native_audio_cache(app: &AppHandle) -> Result<(), String> {
    for (path, _, _) in native_audio_cache_files(app)? {
        let _ = std::fs::remove_file(path);
    }
    Ok(())
}

pub(super) fn enforce_native_audio_cache_limit(
    app: &AppHandle,
    max_bytes: u64,
) -> Result<(), String> {
    let mut files = native_audio_cache_files(app)?;
    files.sort_by(|a, b| a.2.cmp(&b.2));

    let mut current_size: u64 = files.iter().map(|(_, size, _)| *size).sum();
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

fn native_audio_cache_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let mut dir = app
        .path()
        .app_cache_dir()
        .map_err(|err| format!("resolve app cache dir failed: {err}"))?;
    dir.push("native_audio");
    Ok(dir)
}

fn native_audio_cache_files(app: &AppHandle) -> Result<Vec<(PathBuf, u64, SystemTime)>, String> {
    let dir = native_audio_cache_dir(app)?;
    if !dir.exists() {
        return Ok(Vec::new());
    }

    let entries =
        std::fs::read_dir(&dir).map_err(|err| format!("read native audio cache failed: {err}"))?;
    let mut files = Vec::new();

    for entry in entries.flatten() {
        let path = entry.path();
        let Ok(metadata) = entry.metadata() else {
            continue;
        };
        if metadata.is_file() {
            files.push((
                path,
                metadata.len(),
                metadata.accessed().unwrap_or(SystemTime::UNIX_EPOCH),
            ));
        }
    }

    Ok(files)
}

fn unique_suffix() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or(0)
}

fn is_stale_request(latest_request_id: &AtomicU64, request_id: u64) -> bool {
    latest_request_id.load(Ordering::SeqCst) != request_id
}

fn decode_source_path(source: &str) -> PathBuf {
    let raw = source
        .strip_prefix("file://")
        .or_else(|| source.strip_prefix("localmusic://localhost/"))
        .or_else(|| source.strip_prefix("asset://localhost/"))
        .unwrap_or(source);

    let mut decoded = percent_decode_str(raw).decode_utf8_lossy().to_string();
    if cfg!(windows)
        && decoded.starts_with('/')
        && decoded.len() > 3
        && decoded.as_bytes().get(2) == Some(&b':')
    {
        decoded.remove(0);
    }

    PathBuf::from(decoded)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_replay_gain_numbers_with_units() {
        assert_eq!(parse_replay_gain_number("-7.25 dB"), Some(-7.25));
        assert_eq!(parse_replay_gain_number("+2.0 dB"), Some(2.0));
        assert_eq!(parse_replay_gain_number("0.987654"), Some(0.987654));
        assert_eq!(parse_replay_gain_number("not tagged"), None);
    }
}
