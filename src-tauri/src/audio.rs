mod command;
mod controller;
mod device;
mod dsp;
mod engine;
mod event;
mod pipeline;
mod snapshot;
mod source;
mod state;
mod streaming;
mod types;

use tauri::{AppHandle, State};

pub use controller::AudioState;
use types::{AudioSnapshot, PreloadResult};

#[tauri::command]
pub async fn player_load(
    app: AppHandle,
    state: State<'_, AudioState>,
    source: String,
    autoplay: bool,
    request_id: u64,
) -> Result<AudioSnapshot, String> {
    controller::player_load(app, &state, source, autoplay, request_id).await
}

#[tauri::command]
pub async fn player_preload(
    app: AppHandle,
    state: State<'_, AudioState>,
    source: String,
    request_id: u64,
) -> Result<PreloadResult, String> {
    controller::player_preload(app, &state, source, request_id).await
}

#[tauri::command]
pub fn get_native_audio_cache_size(app: AppHandle) -> Result<u64, String> {
    source::native_audio_cache_size(&app)
}

#[tauri::command]
pub fn clear_native_audio_cache(app: AppHandle) -> Result<(), String> {
    source::clear_native_audio_cache(&app)
}

#[tauri::command]
pub fn enforce_native_audio_cache_limit(app: AppHandle, max_bytes: u64) -> Result<(), String> {
    source::enforce_native_audio_cache_limit(&app, max_bytes)
}

#[tauri::command]
pub fn list_audio_output_devices() -> Result<Vec<device::AudioDeviceInfo>, String> {
    device::list_output_devices()
}

#[tauri::command]
pub fn player_set_output_device(
    app: AppHandle,
    state: State<'_, AudioState>,
    device_id: Option<String>,
) -> Result<AudioSnapshot, String> {
    controller::player_set_output_device(app, &state, device_id)
}

#[tauri::command]
pub fn player_set_replay_gain(
    app: AppHandle,
    state: State<'_, AudioState>,
    enabled: bool,
    preamp_db: f32,
) -> Result<AudioSnapshot, String> {
    controller::player_set_replay_gain(app, &state, enabled, preamp_db)
}

#[tauri::command]
pub fn player_set_equalizer(
    app: AppHandle,
    state: State<'_, AudioState>,
    enabled: bool,
    gains_db: Vec<f32>,
) -> Result<AudioSnapshot, String> {
    controller::player_set_equalizer(app, &state, enabled, gains_db)
}

#[tauri::command]
pub fn player_set_crossfade(
    app: AppHandle,
    state: State<'_, AudioState>,
    duration_secs: f64,
) -> Result<AudioSnapshot, String> {
    controller::player_set_crossfade(app, &state, duration_secs)
}

#[tauri::command]
pub fn player_play(app: AppHandle, state: State<'_, AudioState>) -> Result<AudioSnapshot, String> {
    controller::player_play(app, &state)
}

#[tauri::command]
pub fn player_pause(app: AppHandle, state: State<'_, AudioState>) -> Result<AudioSnapshot, String> {
    controller::player_pause(app, &state)
}

#[tauri::command]
pub fn player_seek(
    app: AppHandle,
    state: State<'_, AudioState>,
    position_secs: f64,
) -> Result<AudioSnapshot, String> {
    controller::player_seek(app, &state, position_secs)
}

#[tauri::command]
pub fn player_set_volume(
    app: AppHandle,
    state: State<'_, AudioState>,
    volume: f32,
) -> Result<AudioSnapshot, String> {
    controller::player_set_volume(app, &state, volume)
}

#[tauri::command]
pub fn player_stop(app: AppHandle, state: State<'_, AudioState>) -> Result<AudioSnapshot, String> {
    controller::player_stop(app, &state)
}

#[tauri::command]
pub fn player_get_state(state: State<'_, AudioState>) -> Result<AudioSnapshot, String> {
    controller::player_get_state(&state)
}
