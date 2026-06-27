use serde::Serialize;

use super::dsp::{EQUALIZER_BANDS, SPECTRUM_BANDS};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioSnapshot {
    pub(super) request_id: u64,
    pub(super) is_ready: bool,
    pub(super) is_playing: bool,
    pub(super) current_time: f64,
    pub(super) duration: f64,
    pub(super) volume: f32,
    pub(super) source: Option<String>,
    pub(super) audio_level: f32,
    pub(super) audio_spectrum: Vec<f32>,
    pub(super) replay_gain_db: Option<f32>,
    pub(super) replay_gain_applied: bool,
    pub(super) replay_gain_preamp_db: f32,
    pub(super) equalizer_enabled: bool,
    pub(super) equalizer_gains_db: Vec<f32>,
    pub(super) crossfade_duration: f64,
}

impl AudioSnapshot {
    pub(super) fn idle(volume: f32, request_id: u64) -> Self {
        Self {
            request_id,
            is_ready: false,
            is_playing: false,
            current_time: 0.0,
            duration: 0.0,
            volume,
            source: None,
            audio_level: 0.0,
            audio_spectrum: vec![0.0; SPECTRUM_BANDS],
            replay_gain_db: None,
            replay_gain_applied: false,
            replay_gain_preamp_db: 0.0,
            equalizer_enabled: false,
            equalizer_gains_db: vec![0.0; EQUALIZER_BANDS],
            crossfade_duration: 0.0,
        }
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PreloadResult {
    pub(super) request_id: u64,
    pub(super) is_ready: bool,
    pub(super) source: Option<String>,
    pub(super) duration: f64,
}

#[derive(Clone, Serialize)]
pub(super) struct AudioEvent {
    kind: String,
    snapshot: Option<AudioSnapshot>,
    message: Option<String>,
}

impl AudioEvent {
    pub(super) fn snapshot(kind: &str, snapshot: AudioSnapshot) -> Self {
        Self {
            kind: kind.to_string(),
            snapshot: Some(snapshot),
            message: None,
        }
    }
}
