use std::sync::{
    atomic::{AtomicU64, Ordering},
    mpsc, Arc, Mutex,
};

use tauri::AppHandle;

use super::command::{AudioCommand, ResponseTx};
use super::engine::{run_audio_thread, safe_duration_from_secs};
use super::snapshot::{current_snapshot, duration_secs};
use super::source::{probe_source_duration, resolve_audio_source};
pub use super::types::{AudioSnapshot, PreloadResult};

pub struct AudioState {
    tx: mpsc::Sender<AudioCommand>,
    snapshot: Arc<Mutex<AudioSnapshot>>,
    latest_request_id: Arc<AtomicU64>,
}

impl AudioState {
    pub fn new() -> Self {
        let (tx, rx) = mpsc::channel();
        let snapshot = Arc::new(Mutex::new(AudioSnapshot::idle(0.7, 0)));
        let snapshot_for_thread = Arc::clone(&snapshot);

        std::thread::spawn(move || run_audio_thread(rx, snapshot_for_thread));

        Self {
            tx,
            snapshot,
            latest_request_id: Arc::new(AtomicU64::new(0)),
        }
    }
}

pub async fn player_load(
    app: AppHandle,
    state: &AudioState,
    source: String,
    autoplay: bool,
    request_id: u64,
) -> Result<AudioSnapshot, String> {
    state.latest_request_id.store(request_id, Ordering::SeqCst);

    let _ = send_command(state, |respond_to| AudioCommand::BeginLoad {
        app: app.clone(),
        request_id,
        respond_to,
    })?;

    let resolved_source = resolve_audio_source(
        &app,
        source,
        Arc::clone(&state.latest_request_id),
        request_id,
    )
    .await;
    let Some(source) = (match resolved_source {
        Ok(source) => source,
        Err(err) => {
            if !is_stale_request(&state.latest_request_id, request_id) {
                let _ = send_command(state, |respond_to| AudioCommand::Stop {
                    app: app.clone(),
                    request_id,
                    respond_to,
                });
            }
            return Err(err);
        }
    }) else {
        return Ok(current_snapshot(&state.snapshot));
    };

    if is_stale_request(&state.latest_request_id, request_id) {
        return Ok(current_snapshot(&state.snapshot));
    }

    send_command(state, |respond_to| AudioCommand::Load {
        app,
        source,
        autoplay,
        request_id,
        respond_to,
    })
}

pub async fn player_preload(
    app: AppHandle,
    state: &AudioState,
    source: String,
    request_id: u64,
) -> Result<PreloadResult, String> {
    let Some(source) = resolve_audio_source(
        &app,
        source,
        Arc::clone(&state.latest_request_id),
        request_id,
    )
    .await?
    else {
        return Ok(PreloadResult {
            request_id,
            is_ready: false,
            source: None,
            duration: 0.0,
        });
    };

    if is_stale_request(&state.latest_request_id, request_id) {
        return Ok(PreloadResult {
            request_id,
            is_ready: false,
            source: None,
            duration: 0.0,
        });
    }

    let duration = probe_source_duration(&source)?;
    Ok(PreloadResult {
        request_id,
        is_ready: true,
        source: Some(source.label()),
        duration: duration_secs(duration),
    })
}

pub fn player_set_output_device(
    app: AppHandle,
    state: &AudioState,
    device_id: Option<String>,
) -> Result<AudioSnapshot, String> {
    send_command(state, |respond_to| AudioCommand::SetOutputDevice {
        app,
        device_id,
        respond_to,
    })
}

pub fn player_set_replay_gain(
    app: AppHandle,
    state: &AudioState,
    enabled: bool,
    preamp_db: f32,
) -> Result<AudioSnapshot, String> {
    send_command(state, |respond_to| AudioCommand::SetReplayGain {
        app,
        enabled,
        preamp_db,
        respond_to,
    })
}

pub fn player_set_equalizer(
    app: AppHandle,
    state: &AudioState,
    enabled: bool,
    gains_db: Vec<f32>,
) -> Result<AudioSnapshot, String> {
    send_command(state, |respond_to| AudioCommand::SetEqualizer {
        app,
        enabled,
        gains_db,
        respond_to,
    })
}

pub fn player_set_crossfade(
    app: AppHandle,
    state: &AudioState,
    duration_secs: f64,
) -> Result<AudioSnapshot, String> {
    let duration = safe_duration_from_secs(duration_secs);
    send_command(state, |respond_to| AudioCommand::SetCrossfade {
        app,
        duration,
        respond_to,
    })
}

pub fn player_play(app: AppHandle, state: &AudioState) -> Result<AudioSnapshot, String> {
    send_command(state, |respond_to| AudioCommand::Play { app, respond_to })
}

pub fn player_pause(app: AppHandle, state: &AudioState) -> Result<AudioSnapshot, String> {
    send_command(state, |respond_to| AudioCommand::Pause { app, respond_to })
}

pub fn player_seek(
    app: AppHandle,
    state: &AudioState,
    position_secs: f64,
) -> Result<AudioSnapshot, String> {
    let position = safe_duration_from_secs(position_secs);
    send_command(state, |respond_to| AudioCommand::Seek {
        app,
        position,
        respond_to,
    })
}

pub fn player_set_volume(
    app: AppHandle,
    state: &AudioState,
    volume: f32,
) -> Result<AudioSnapshot, String> {
    send_command(state, |respond_to| AudioCommand::SetVolume {
        app,
        volume,
        respond_to,
    })
}

pub fn player_stop(app: AppHandle, state: &AudioState) -> Result<AudioSnapshot, String> {
    let request_id = state.latest_request_id.load(Ordering::SeqCst);
    send_command(state, |respond_to| AudioCommand::Stop {
        app,
        request_id,
        respond_to,
    })
}

pub fn player_get_state(state: &AudioState) -> Result<AudioSnapshot, String> {
    Ok(current_snapshot(&state.snapshot))
}

fn is_stale_request(latest_request_id: &AtomicU64, request_id: u64) -> bool {
    latest_request_id.load(Ordering::SeqCst) != request_id
}

fn send_command<F>(state: &AudioState, build: F) -> Result<AudioSnapshot, String>
where
    F: FnOnce(ResponseTx) -> AudioCommand,
{
    let (respond_to, response) = mpsc::channel();
    state
        .tx
        .send(build(respond_to))
        .map_err(|_| "audio thread is not available".to_string())?;
    response
        .recv()
        .map_err(|_| "audio thread dropped response".to_string())?
}
