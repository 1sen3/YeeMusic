use std::{
    sync::{mpsc, Arc, Mutex},
    time::{Duration, Instant},
};
use tauri::AppHandle;

use super::command::AudioCommand;
use super::device::{normalize_device_id, open_output};
use super::event::{emit_snapshot, respond_and_emit};
use super::pipeline::{rebuild_sink, stop_fading_sinks, update_fades};
use super::snapshot::{idle_snapshot, snapshot_inner, store_snapshot};
use super::source::AudioSource;
use super::state::{track_position, AudioThreadInner, TrackState};
use super::types::AudioSnapshot;

const PROGRESS_INTERVAL: Duration = Duration::from_millis(250);
const CROSSFADE_MAX_DURATION: Duration = Duration::from_secs(12);

pub(super) fn run_audio_thread(
    rx: mpsc::Receiver<AudioCommand>,
    snapshot_state: Arc<Mutex<AudioSnapshot>>,
) {
    let mut inner = AudioThreadInner::new();
    let mut last_app: Option<AppHandle> = None;

    loop {
        match rx.recv_timeout(PROGRESS_INTERVAL) {
            Ok(command) => handle_command(command, &mut inner, &snapshot_state, &mut last_app),
            Err(mpsc::RecvTimeoutError::Timeout) => {
                if let Some(app) = last_app.as_ref() {
                    tick_progress(app, &mut inner, &snapshot_state);
                }
            }
            Err(mpsc::RecvTimeoutError::Disconnected) => break,
        }
    }
}

fn handle_command(
    command: AudioCommand,
    inner: &mut AudioThreadInner,
    snapshot_state: &Arc<Mutex<AudioSnapshot>>,
    last_app: &mut Option<AppHandle>,
) {
    match command {
        AudioCommand::BeginLoad {
            app,
            request_id,
            respond_to,
        } => {
            *last_app = Some(app.clone());
            let result = begin_load_inner(inner, request_id);
            respond_and_emit(&app, "state", result, respond_to, snapshot_state);
        }
        AudioCommand::Load {
            app,
            source,
            autoplay,
            request_id,
            respond_to,
        } => {
            *last_app = Some(app.clone());
            let result = load_source(inner, source, autoplay, request_id);
            respond_and_emit(&app, "loaded", result, respond_to, snapshot_state);
        }
        AudioCommand::Play { app, respond_to } => {
            *last_app = Some(app.clone());
            let result = play_inner(inner);
            respond_and_emit(&app, "state", result, respond_to, snapshot_state);
        }
        AudioCommand::Pause { app, respond_to } => {
            *last_app = Some(app.clone());
            let result = pause_inner(inner);
            respond_and_emit(&app, "state", result, respond_to, snapshot_state);
        }
        AudioCommand::Seek {
            app,
            position,
            respond_to,
        } => {
            *last_app = Some(app.clone());
            let result = seek_inner(inner, position);
            respond_and_emit(&app, "progress", result, respond_to, snapshot_state);
        }
        AudioCommand::SetVolume {
            app,
            volume,
            respond_to,
        } => {
            *last_app = Some(app.clone());
            let result = set_volume_inner(inner, volume);
            respond_and_emit(&app, "state", result, respond_to, snapshot_state);
        }
        AudioCommand::Stop {
            app,
            request_id,
            respond_to,
        } => {
            *last_app = Some(app.clone());
            let result = stop_inner(inner, request_id);
            respond_and_emit(&app, "state", result, respond_to, snapshot_state);
        }
        AudioCommand::SetOutputDevice {
            app,
            device_id,
            respond_to,
        } => {
            *last_app = Some(app.clone());
            let result = set_output_device_inner(inner, device_id);
            respond_and_emit(&app, "state", result, respond_to, snapshot_state);
        }
        AudioCommand::SetReplayGain {
            app,
            enabled,
            preamp_db,
            respond_to,
        } => {
            *last_app = Some(app.clone());
            let result = set_replay_gain_inner(inner, enabled, preamp_db);
            respond_and_emit(&app, "state", result, respond_to, snapshot_state);
        }
        AudioCommand::SetEqualizer {
            app,
            enabled,
            gains_db,
            respond_to,
        } => {
            *last_app = Some(app.clone());
            let result = set_equalizer_inner(inner, enabled, gains_db);
            respond_and_emit(&app, "state", result, respond_to, snapshot_state);
        }
        AudioCommand::SetCrossfade {
            app,
            duration,
            respond_to,
        } => {
            *last_app = Some(app.clone());
            let result = set_crossfade_inner(inner, duration);
            respond_and_emit(&app, "state", result, respond_to, snapshot_state);
        }
    }
}

pub(super) fn safe_duration_from_secs(secs: f64) -> Duration {
    if secs.is_finite() && secs > 0.0 {
        Duration::from_secs_f64(secs)
    } else {
        Duration::ZERO
    }
}

fn normalize_crossfade_duration(duration: Duration) -> Duration {
    duration.min(CROSSFADE_MAX_DURATION)
}

fn begin_load_inner(
    inner: &mut AudioThreadInner,
    request_id: u64,
) -> Result<AudioSnapshot, String> {
    let has_playing_sink = inner.sink.is_some()
        && inner
            .track
            .as_ref()
            .map(|track| track.is_playing)
            .unwrap_or(false);

    if inner.crossfade_duration.is_zero() || !has_playing_sink {
        return stop_inner(inner, request_id);
    }

    inner.request_id = request_id;
    Ok(idle_snapshot(inner, request_id))
}

fn load_source(
    inner: &mut AudioThreadInner,
    source: AudioSource,
    autoplay: bool,
    request_id: u64,
) -> Result<AudioSnapshot, String> {
    inner.request_id = request_id;

    inner.track = Some(TrackState {
        source,
        request_id,
        duration: None,
        base_position: Duration::ZERO,
        started_at: if autoplay { Some(Instant::now()) } else { None },
        is_playing: autoplay,
    });

    let duration = match rebuild_sink(inner, Duration::ZERO, autoplay, true) {
        Ok(duration) => duration,
        Err(error) => {
            let _ = stop_inner(inner, request_id);
            return Err(error);
        }
    };
    if let Some(track) = inner.track.as_mut() {
        track.duration = duration;
    }

    Ok(snapshot_inner(inner))
}

fn play_inner(inner: &mut AudioThreadInner) -> Result<AudioSnapshot, String> {
    if inner.track.is_none() {
        return Err("no loaded audio source".to_string());
    }

    if inner.sink.is_none() {
        let position = inner
            .track
            .as_ref()
            .map(track_position)
            .unwrap_or(Duration::ZERO);
        let duration = rebuild_sink(inner, position, true, false)?;
        if let Some(track) = inner.track.as_mut() {
            track.duration = duration.or(track.duration);
        }
    } else if let Some(sink) = inner.sink.as_ref() {
        sink.play();
    }

    if let Some(track) = inner.track.as_mut() {
        track.base_position = track_position(track);
        track.started_at = Some(Instant::now());
        track.is_playing = true;
    }

    Ok(snapshot_inner(inner))
}

fn pause_inner(inner: &mut AudioThreadInner) -> Result<AudioSnapshot, String> {
    if let Some(track) = inner.track.as_mut() {
        track.base_position = track_position(track);
        track.started_at = None;
        track.is_playing = false;
    }
    if let Some(sink) = inner.sink.as_ref() {
        sink.pause();
    }

    Ok(snapshot_inner(inner))
}

fn seek_inner(
    inner: &mut AudioThreadInner,
    mut position: Duration,
) -> Result<AudioSnapshot, String> {
    let Some(track) = inner.track.as_ref() else {
        return Err("no loaded audio source".to_string());
    };

    if let Some(duration) = track.duration {
        position = position.min(duration);
    }
    let was_playing = track.is_playing;
    let duration = rebuild_sink(inner, position, was_playing, false)?;

    if let Some(track) = inner.track.as_mut() {
        track.duration = duration.or(track.duration);
        track.base_position = position;
        track.started_at = if was_playing {
            Some(Instant::now())
        } else {
            None
        };
        track.is_playing = was_playing;
    }

    Ok(snapshot_inner(inner))
}

fn set_volume_inner(inner: &mut AudioThreadInner, volume: f32) -> Result<AudioSnapshot, String> {
    inner.volume = volume.clamp(0.0, 1.5);
    if let Some(sink) = inner.sink.as_ref() {
        if let Some(fade_in) = inner.fade_in.as_mut() {
            fade_in.target_volume = inner.volume;
        } else {
            sink.set_volume(inner.volume);
        }
    }

    Ok(snapshot_inner(inner))
}

fn set_output_device_inner(
    inner: &mut AudioThreadInner,
    device_id: Option<String>,
) -> Result<AudioSnapshot, String> {
    let selected_device_id = normalize_device_id(device_id);
    if selected_device_id == inner.selected_device_id {
        return Ok(snapshot_inner(inner));
    }

    let (stream, handle) = open_output(selected_device_id.as_deref())?;

    let track_position = inner
        .track
        .as_ref()
        .map(track_position)
        .unwrap_or(Duration::ZERO);
    let was_playing = inner
        .track
        .as_ref()
        .map(|track| track.is_playing)
        .unwrap_or(false);

    if let Some(sink) = inner.sink.take() {
        sink.stop();
    }
    stop_fading_sinks(inner);
    inner.stream = Some(stream);
    inner.handle = Some(handle);
    inner.selected_device_id = selected_device_id;

    if inner.track.is_some() {
        let duration = rebuild_sink(inner, track_position, was_playing, false)?;
        if let Some(track) = inner.track.as_mut() {
            track.duration = duration.or(track.duration);
            track.base_position = track_position;
            track.started_at = if was_playing {
                Some(Instant::now())
            } else {
                None
            };
            track.is_playing = was_playing;
        }
    }

    Ok(snapshot_inner(inner))
}

fn set_replay_gain_inner(
    inner: &mut AudioThreadInner,
    enabled: bool,
    preamp_db: f32,
) -> Result<AudioSnapshot, String> {
    inner.dsp.set_replay_gain(enabled, preamp_db);
    Ok(snapshot_inner(inner))
}

fn set_equalizer_inner(
    inner: &mut AudioThreadInner,
    enabled: bool,
    gains_db: Vec<f32>,
) -> Result<AudioSnapshot, String> {
    inner.dsp.set_equalizer(enabled, gains_db);
    Ok(snapshot_inner(inner))
}

fn set_crossfade_inner(
    inner: &mut AudioThreadInner,
    duration: Duration,
) -> Result<AudioSnapshot, String> {
    inner.crossfade_duration = normalize_crossfade_duration(duration);
    Ok(snapshot_inner(inner))
}

fn stop_inner(inner: &mut AudioThreadInner, request_id: u64) -> Result<AudioSnapshot, String> {
    inner.request_id = request_id;
    if let Some(sink) = inner.sink.take() {
        sink.stop();
    }
    stop_fading_sinks(inner);
    inner.track = None;
    Ok(snapshot_inner(inner))
}

fn tick_progress(
    app: &AppHandle,
    inner: &mut AudioThreadInner,
    snapshot_state: &Arc<Mutex<AudioSnapshot>>,
) {
    update_fades(inner);

    if inner.track.is_none() {
        return;
    }

    let snapshot = snapshot_inner(inner);
    let sink_empty = inner
        .sink
        .as_ref()
        .map(|sink| sink.empty())
        .unwrap_or(false);
    let is_playing = inner
        .track
        .as_ref()
        .map(|track| track.is_playing)
        .unwrap_or(false);
    let is_near_duration =
        snapshot.duration <= 0.0 || snapshot.current_time + 0.25 >= snapshot.duration;
    let ended = sink_empty && is_playing && snapshot.current_time > 0.25 && is_near_duration;

    if ended {
        if let Some(track) = inner.track.as_mut() {
            track.is_playing = false;
            track.started_at = None;
            track.base_position = track
                .duration
                .unwrap_or_else(|| safe_duration_from_secs(snapshot.current_time));
        }
        if let Some(sink) = inner.sink.take() {
            sink.stop();
        }
        let ended_snapshot = snapshot_inner(inner);
        store_snapshot(snapshot_state, ended_snapshot.clone());
        emit_snapshot(app, "ended", ended_snapshot);
    } else {
        store_snapshot(snapshot_state, snapshot.clone());
        emit_snapshot(app, "progress", snapshot);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_crossfade_duration() {
        assert_eq!(normalize_crossfade_duration(Duration::ZERO), Duration::ZERO);
        assert_eq!(
            normalize_crossfade_duration(Duration::from_secs(30)),
            CROSSFADE_MAX_DURATION
        );
    }
}
