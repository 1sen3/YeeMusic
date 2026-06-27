use std::{
    sync::{atomic::Ordering, Arc, Mutex},
    time::Duration,
};

use super::dsp::SPECTRUM_BANDS;
use super::state::{track_position, AudioThreadInner};
use super::types::AudioSnapshot;

pub(super) fn duration_secs(duration: Option<Duration>) -> f64 {
    duration.map(|d| d.as_secs_f64()).unwrap_or(0.0)
}

pub(super) fn snapshot_inner(inner: &AudioThreadInner) -> AudioSnapshot {
    if let Some(track) = &inner.track {
        let audio_level = if track.is_playing {
            f32::from_bits(inner.audio_level.load(Ordering::Relaxed))
        } else {
            0.0
        };
        let audio_spectrum = read_audio_spectrum(inner, track.is_playing);
        let replay_gain = track.source.replay_gain();
        let replay_gain_state = inner.dsp.replay_gain_state();
        let equalizer_state = inner.dsp.equalizer_state();
        let replay_gain_applied = replay_gain_state.enabled && replay_gain.is_some();

        AudioSnapshot {
            request_id: track.request_id,
            is_ready: true,
            is_playing: track.is_playing,
            current_time: track_position(track).as_secs_f64(),
            duration: duration_secs(track.duration),
            volume: inner.volume,
            source: Some(track.source.label()),
            audio_level,
            audio_spectrum,
            replay_gain_db: replay_gain.map(|info| info.gain_db),
            replay_gain_applied,
            replay_gain_preamp_db: replay_gain_state.preamp_db,
            equalizer_enabled: equalizer_state.enabled,
            equalizer_gains_db: equalizer_state.gains_db.to_vec(),
            crossfade_duration: inner.crossfade_duration.as_secs_f64(),
        }
    } else {
        idle_snapshot(inner, inner.request_id)
    }
}

pub(super) fn idle_snapshot(inner: &AudioThreadInner, request_id: u64) -> AudioSnapshot {
    let replay_gain_state = inner.dsp.replay_gain_state();
    let equalizer_state = inner.dsp.equalizer_state();
    let mut snapshot = AudioSnapshot::idle(inner.volume, request_id);
    snapshot.replay_gain_preamp_db = replay_gain_state.preamp_db;
    snapshot.replay_gain_applied = false;
    snapshot.equalizer_enabled = equalizer_state.enabled;
    snapshot.equalizer_gains_db = equalizer_state.gains_db.to_vec();
    snapshot.crossfade_duration = inner.crossfade_duration.as_secs_f64();
    snapshot
}

pub(super) fn store_snapshot(snapshot_state: &Arc<Mutex<AudioSnapshot>>, snapshot: AudioSnapshot) {
    if let Ok(mut current) = snapshot_state.lock() {
        *current = snapshot;
    }
}

pub(super) fn current_snapshot(snapshot_state: &Arc<Mutex<AudioSnapshot>>) -> AudioSnapshot {
    snapshot_state
        .lock()
        .map(|snapshot| snapshot.clone())
        .unwrap_or_else(|_| AudioSnapshot::idle(0.7, 0))
}

fn read_audio_spectrum(inner: &AudioThreadInner, is_playing: bool) -> Vec<f32> {
    if !is_playing {
        return vec![0.0; SPECTRUM_BANDS];
    }

    inner
        .audio_spectrum
        .iter()
        .map(|band| f32::from_bits(band.load(Ordering::Relaxed)))
        .collect()
}
