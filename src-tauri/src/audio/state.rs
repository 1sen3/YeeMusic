use rodio::{OutputStream, OutputStreamHandle, Sink};
use std::{
    sync::{atomic::AtomicU32, Arc},
    time::{Duration, Instant},
};

use super::dsp::{DspState, SPECTRUM_BANDS};
use super::source::AudioSource;

pub(super) struct TrackState {
    pub(super) source: AudioSource,
    pub(super) request_id: u64,
    pub(super) duration: Option<Duration>,
    pub(super) base_position: Duration,
    pub(super) started_at: Option<Instant>,
    pub(super) is_playing: bool,
}

pub(super) struct FadingSink {
    pub(super) sink: Sink,
    pub(super) started_at: Instant,
    pub(super) duration: Duration,
    pub(super) start_volume: f32,
}

pub(super) struct FadeInState {
    pub(super) started_at: Instant,
    pub(super) duration: Duration,
    pub(super) target_volume: f32,
}

pub(super) struct AudioThreadInner {
    pub(super) stream: Option<OutputStream>,
    pub(super) handle: Option<OutputStreamHandle>,
    pub(super) sink: Option<Sink>,
    pub(super) track: Option<TrackState>,
    pub(super) volume: f32,
    pub(super) audio_level: Arc<AtomicU32>,
    pub(super) audio_spectrum: Arc<[AtomicU32; SPECTRUM_BANDS]>,
    pub(super) dsp: Arc<DspState>,
    pub(super) crossfade_duration: Duration,
    pub(super) fading_sinks: Vec<FadingSink>,
    pub(super) fade_in: Option<FadeInState>,
    pub(super) request_id: u64,
    pub(super) selected_device_id: Option<String>,
}

impl AudioThreadInner {
    pub(super) fn new() -> Self {
        Self {
            stream: None,
            handle: None,
            sink: None,
            track: None,
            volume: 0.7,
            audio_level: Arc::new(AtomicU32::new(0.0f32.to_bits())),
            audio_spectrum: Arc::new(std::array::from_fn(|_| AtomicU32::new(0.0f32.to_bits()))),
            dsp: Arc::new(DspState::new()),
            crossfade_duration: Duration::ZERO,
            fading_sinks: Vec::new(),
            fade_in: None,
            request_id: 0,
            selected_device_id: None,
        }
    }
}

pub(super) fn track_position(track: &TrackState) -> Duration {
    let mut position = track.base_position;
    if track.is_playing {
        if let Some(started_at) = track.started_at {
            position = position.saturating_add(started_at.elapsed());
        }
    }

    if let Some(duration) = track.duration {
        position.min(duration)
    } else {
        position
    }
}
