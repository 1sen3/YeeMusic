use rodio::{Decoder, Sink, Source};
use std::{
    fs::File,
    io::BufReader,
    sync::{
        atomic::{AtomicU32, Ordering},
        Arc,
    },
    time::{Duration, Instant},
};

use super::device::open_output;
use super::dsp::{DspState, LevelMeter, SPECTRUM_BANDS};
use super::source::AudioSource;
use super::state::{AudioThreadInner, FadeInState, FadingSink};
use super::streaming::decode_streaming_reader;

pub(super) fn rebuild_sink(
    inner: &mut AudioThreadInner,
    position: Duration,
    is_playing: bool,
    crossfade_old_sink: bool,
) -> Result<Option<Duration>, String> {
    let source = inner
        .track
        .as_ref()
        .map(|track| track.source.clone())
        .ok_or_else(|| "no loaded audio source".to_string())?;

    ensure_output(inner)?;
    let handle = inner
        .handle
        .as_ref()
        .ok_or_else(|| "audio output handle is not initialized".to_string())?;
    let sink = Sink::try_new(handle).map_err(|err| format!("create audio sink failed: {err}"))?;
    let should_crossfade = crossfade_old_sink
        && is_playing
        && inner.sink.is_some()
        && !inner.crossfade_duration.is_zero();
    sink.set_volume(if should_crossfade { 0.0 } else { inner.volume });

    reset_audio_analysis(inner);
    let duration = append_source(
        &sink,
        &source,
        position,
        Arc::clone(&inner.audio_level),
        Arc::clone(&inner.audio_spectrum),
        Arc::clone(&inner.dsp),
    )?;
    if !is_playing {
        sink.pause();
    }

    if let Some(old_sink) = inner.sink.take() {
        if should_crossfade {
            inner.fading_sinks.push(FadingSink {
                sink: old_sink,
                started_at: Instant::now(),
                duration: inner.crossfade_duration,
                start_volume: inner.volume,
            });
            inner.fade_in = Some(FadeInState {
                started_at: Instant::now(),
                duration: inner.crossfade_duration,
                target_volume: inner.volume,
            });
        } else {
            old_sink.stop();
            stop_fading_sinks(inner);
        }
    }
    inner.sink = Some(sink);
    Ok(duration)
}

pub(super) fn update_fades(inner: &mut AudioThreadInner) {
    let now = Instant::now();

    if let Some(fade_in) = inner.fade_in.as_ref() {
        let progress = fade_progress(now, fade_in.started_at, fade_in.duration);
        if let Some(sink) = inner.sink.as_ref() {
            sink.set_volume(fade_in.target_volume * progress);
        }
        if progress >= 1.0 {
            if let Some(sink) = inner.sink.as_ref() {
                sink.set_volume(fade_in.target_volume);
            }
            inner.fade_in = None;
        }
    }

    inner.fading_sinks.retain_mut(|fade| {
        let progress = fade_progress(now, fade.started_at, fade.duration);
        let volume = fade.start_volume * (1.0 - progress);
        fade.sink.set_volume(volume.max(0.0));
        if progress >= 1.0 || fade.sink.empty() {
            fade.sink.stop();
            false
        } else {
            true
        }
    });
}

pub(super) fn stop_fading_sinks(inner: &mut AudioThreadInner) {
    inner.fade_in = None;
    for fade in inner.fading_sinks.drain(..) {
        fade.sink.stop();
    }
}

fn fade_progress(now: Instant, started_at: Instant, duration: Duration) -> f32 {
    if duration.is_zero() {
        return 1.0;
    }

    (now.saturating_duration_since(started_at).as_secs_f32() / duration.as_secs_f32())
        .clamp(0.0, 1.0)
}

fn ensure_output(inner: &mut AudioThreadInner) -> Result<(), String> {
    if inner.handle.is_some() {
        return Ok(());
    }

    let (stream, handle) = open_output(inner.selected_device_id.as_deref())?;
    inner.stream = Some(stream);
    inner.handle = Some(handle);
    Ok(())
}

fn append_source(
    sink: &Sink,
    source: &AudioSource,
    position: Duration,
    audio_level: Arc<AtomicU32>,
    audio_spectrum: Arc<[AtomicU32; SPECTRUM_BANDS]>,
    dsp: Arc<DspState>,
) -> Result<Option<Duration>, String> {
    match source {
        AudioSource::File { path, .. } => {
            let file = File::open(path)
                .map_err(|err| format!("open audio file {} failed: {err}", path.display()))?;
            let decoder = Decoder::new(BufReader::new(file))
                .map_err(|err| format!("decode audio file {} failed: {err}", path.display()))?;
            let duration = decoder.total_duration();
            sink.append(LevelMeter::new(
                decoder.skip_duration(position),
                audio_level,
                audio_spectrum,
                source.replay_gain(),
                Arc::clone(&dsp),
            ));
            Ok(duration)
        }
        AudioSource::Stream {
            reader,
            format,
            label,
            ..
        } => {
            let decoder = decode_streaming_reader(reader.clone(), *format).map_err(|err| {
                format!(
                    "decode streaming {} audio {label} failed: {err}",
                    format.label()
                )
            })?;
            let duration = decoder.total_duration();
            sink.append(LevelMeter::new(
                decoder.skip_duration(position),
                audio_level,
                audio_spectrum,
                source.replay_gain(),
                Arc::clone(&dsp),
            ));
            Ok(duration)
        }
    }
}

fn reset_audio_analysis(inner: &AudioThreadInner) {
    inner.audio_level.store(0.0f32.to_bits(), Ordering::Relaxed);
    for band in inner.audio_spectrum.iter() {
        band.store(0.0f32.to_bits(), Ordering::Relaxed);
    }
}
