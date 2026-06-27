use super::source::ReplayGainInfo;
use rodio::Source;
use std::{
    sync::{
        atomic::{AtomicBool, AtomicU32, AtomicU64, Ordering},
        Arc,
    },
    time::Duration,
};

const LEVEL_WINDOW_SAMPLES: usize = 2048;
const LEVEL_DISPLAY_GAIN: f32 = 1.8;
pub(super) const SPECTRUM_BANDS: usize = 12;
const SPECTRUM_WINDOW_FRAMES: usize = 2048;
const SPECTRUM_DISPLAY_GAIN: f32 = 18.0;
const SPECTRUM_BAND_CENTERS: [f32; SPECTRUM_BANDS] = [
    50.0, 90.0, 160.0, 280.0, 500.0, 900.0, 1600.0, 2800.0, 5000.0, 8000.0, 12000.0, 16000.0,
];
const REPLAY_GAIN_MAX_FACTOR: f32 = 4.0;
pub(super) const EQUALIZER_BANDS: usize = 5;
const EQUALIZER_GAIN_LIMIT_DB: f32 = 12.0;
const EQUALIZER_Q: f32 = 1.0;
const EQUALIZER_BAND_CENTERS: [f32; EQUALIZER_BANDS] = [60.0, 230.0, 910.0, 3600.0, 14000.0];
const OUTPUT_LIMITER_THRESHOLD: f32 = 0.98;

#[derive(Clone, Copy)]
pub(super) struct ReplayGainState {
    pub(super) enabled: bool,
    pub(super) preamp_db: f32,
    pub(super) version: u64,
}

#[derive(Clone, Copy)]
pub(super) struct EqualizerState {
    pub(super) enabled: bool,
    pub(super) gains_db: [f32; EQUALIZER_BANDS],
    pub(super) version: u64,
}

pub(super) struct DspState {
    replay_gain_enabled: AtomicBool,
    replay_gain_preamp_db_bits: AtomicU32,
    replay_gain_version: AtomicU64,
    equalizer_enabled: AtomicBool,
    equalizer_gains_db_bits: [AtomicU32; EQUALIZER_BANDS],
    equalizer_version: AtomicU64,
}

impl DspState {
    pub(super) fn new() -> Self {
        Self {
            replay_gain_enabled: AtomicBool::new(true),
            replay_gain_preamp_db_bits: AtomicU32::new(0.0f32.to_bits()),
            replay_gain_version: AtomicU64::new(0),
            equalizer_enabled: AtomicBool::new(false),
            equalizer_gains_db_bits: std::array::from_fn(|_| AtomicU32::new(0.0f32.to_bits())),
            equalizer_version: AtomicU64::new(0),
        }
    }

    pub(super) fn replay_gain_state(&self) -> ReplayGainState {
        loop {
            let version = self.replay_gain_version.load(Ordering::Acquire);
            let enabled = self.replay_gain_enabled.load(Ordering::Relaxed);
            let preamp_db = f32::from_bits(self.replay_gain_preamp_db_bits.load(Ordering::Relaxed));

            if self.replay_gain_version.load(Ordering::Acquire) == version {
                return ReplayGainState {
                    enabled,
                    preamp_db,
                    version,
                };
            }
        }
    }

    pub(super) fn set_replay_gain(&self, enabled: bool, preamp_db: f32) {
        self.replay_gain_enabled.store(enabled, Ordering::Relaxed);
        self.replay_gain_preamp_db_bits
            .store(preamp_db.clamp(-12.0, 12.0).to_bits(), Ordering::Relaxed);
        self.replay_gain_version.fetch_add(1, Ordering::Release);
    }

    pub(super) fn equalizer_state(&self) -> EqualizerState {
        loop {
            let version = self.equalizer_version.load(Ordering::Acquire);
            let enabled = self.equalizer_enabled.load(Ordering::Relaxed);
            let gains_db = std::array::from_fn(|index| {
                f32::from_bits(self.equalizer_gains_db_bits[index].load(Ordering::Relaxed))
            });

            if self.equalizer_version.load(Ordering::Acquire) == version {
                return EqualizerState {
                    enabled,
                    gains_db,
                    version,
                };
            }
        }
    }

    pub(super) fn set_equalizer(&self, enabled: bool, gains_db: Vec<f32>) {
        let gains_db = normalize_equalizer_gains(gains_db);
        self.equalizer_enabled.store(enabled, Ordering::Relaxed);
        for (index, gain) in gains_db.iter().enumerate() {
            self.equalizer_gains_db_bits[index].store(gain.to_bits(), Ordering::Relaxed);
        }
        self.equalizer_version.fetch_add(1, Ordering::Release);
    }
}

pub(super) struct LevelMeter<S> {
    inner: S,
    level: Arc<AtomicU32>,
    spectrum: Arc<[AtomicU32; SPECTRUM_BANDS]>,
    source_replay_gain: Option<ReplayGainInfo>,
    dsp: Arc<DspState>,
    replay_gain_version: u64,
    playback_gain: f32,
    equalizer: EqualizerProcessor,
    sum_squares: f32,
    sample_count: usize,
    smoothed_level: f32,
    spectrum_window: [f32; SPECTRUM_WINDOW_FRAMES],
    spectrum_count: usize,
    smoothed_spectrum: [f32; SPECTRUM_BANDS],
    frame_sum: f32,
    frame_channel_count: u16,
}

impl<S> LevelMeter<S>
where
    S: Source<Item = i16>,
{
    pub(super) fn new(
        inner: S,
        level: Arc<AtomicU32>,
        spectrum: Arc<[AtomicU32; SPECTRUM_BANDS]>,
        source_replay_gain: Option<ReplayGainInfo>,
        dsp: Arc<DspState>,
    ) -> Self {
        let equalizer =
            EqualizerProcessor::new(Arc::clone(&dsp), inner.sample_rate(), inner.channels());
        Self {
            inner,
            level,
            spectrum,
            source_replay_gain,
            dsp,
            replay_gain_version: u64::MAX,
            playback_gain: 1.0,
            equalizer,
            sum_squares: 0.0,
            sample_count: 0,
            smoothed_level: 0.0,
            spectrum_window: [0.0; SPECTRUM_WINDOW_FRAMES],
            spectrum_count: 0,
            smoothed_spectrum: [0.0; SPECTRUM_BANDS],
            frame_sum: 0.0,
            frame_channel_count: 0,
        }
    }

    fn refresh_playback_gain(&mut self) {
        let state = self.dsp.replay_gain_state();
        if self.replay_gain_version == state.version {
            return;
        }

        self.replay_gain_version = state.version;
        self.playback_gain =
            replay_gain_factor(self.source_replay_gain, state.enabled, state.preamp_db);
    }

    fn push_spectrum_sample(&mut self, sample: f32) {
        self.spectrum_window[self.spectrum_count] = sample;
        self.spectrum_count += 1;

        if self.spectrum_count >= SPECTRUM_WINDOW_FRAMES {
            update_spectrum(
                &self.spectrum_window,
                self.inner.sample_rate(),
                &mut self.smoothed_spectrum,
                &self.spectrum,
            );
            self.spectrum_count = 0;
        }
    }
}

impl<S> Iterator for LevelMeter<S>
where
    S: Source<Item = i16>,
{
    type Item = i16;

    fn next(&mut self) -> Option<Self::Item> {
        let sample = self.inner.next()?;
        self.refresh_playback_gain();
        let replay_gain_sample = sample as f32 / i16::MAX as f32 * self.playback_gain;
        let normalized = soft_limit_sample(self.equalizer.process(replay_gain_sample));
        self.sum_squares += normalized * normalized;
        self.sample_count += 1;
        self.frame_sum += normalized;
        self.frame_channel_count += 1;

        let channels = self.inner.channels().max(1);
        if self.frame_channel_count >= channels {
            let mono_sample = self.frame_sum / f32::from(channels);
            self.push_spectrum_sample(mono_sample);
            self.frame_sum = 0.0;
            self.frame_channel_count = 0;
        }

        if self.sample_count >= LEVEL_WINDOW_SAMPLES {
            let rms = (self.sum_squares / self.sample_count as f32).sqrt();
            let display_level = (rms * LEVEL_DISPLAY_GAIN).clamp(0.0, 1.0);
            let factor = if display_level > self.smoothed_level {
                0.45
            } else {
                0.12
            };
            self.smoothed_level += (display_level - self.smoothed_level) * factor;
            self.level
                .store(self.smoothed_level.to_bits(), Ordering::Relaxed);
            self.sum_squares = 0.0;
            self.sample_count = 0;
        }

        Some((normalized * i16::MAX as f32) as i16)
    }
}

impl<S> Source for LevelMeter<S>
where
    S: Source<Item = i16>,
{
    fn current_frame_len(&self) -> Option<usize> {
        self.inner.current_frame_len()
    }

    fn channels(&self) -> u16 {
        self.inner.channels()
    }

    fn sample_rate(&self) -> u32 {
        self.inner.sample_rate()
    }

    fn total_duration(&self) -> Option<Duration> {
        self.inner.total_duration()
    }
}

fn update_spectrum(
    window: &[f32; SPECTRUM_WINDOW_FRAMES],
    sample_rate: u32,
    smoothed_spectrum: &mut [f32; SPECTRUM_BANDS],
    spectrum: &[AtomicU32; SPECTRUM_BANDS],
) {
    let sample_rate = sample_rate as f32;
    if sample_rate <= 0.0 {
        return;
    }

    let nyquist = sample_rate / 2.0;
    for (band, center) in SPECTRUM_BAND_CENTERS.iter().enumerate() {
        let frequency = center.min(nyquist * 0.92).max(20.0);
        let normalized_bin = frequency * SPECTRUM_WINDOW_FRAMES as f32 / sample_rate;
        let omega = 2.0 * std::f32::consts::PI * normalized_bin / SPECTRUM_WINDOW_FRAMES as f32;
        let coeff = 2.0 * omega.cos();
        let mut q1 = 0.0f32;
        let mut q2 = 0.0f32;

        for (index, sample) in window.iter().enumerate() {
            let hann = 0.5
                - 0.5
                    * (2.0 * std::f32::consts::PI * index as f32
                        / (SPECTRUM_WINDOW_FRAMES - 1) as f32)
                        .cos();
            let q0 = coeff * q1 - q2 + sample * hann;
            q2 = q1;
            q1 = q0;
        }

        let power = (q1 * q1 + q2 * q2 - coeff * q1 * q2).max(0.0);
        let magnitude = power.sqrt() / SPECTRUM_WINDOW_FRAMES as f32;
        let display_level = (magnitude * SPECTRUM_DISPLAY_GAIN).sqrt().clamp(0.0, 1.0);
        let factor = if display_level > smoothed_spectrum[band] {
            0.5
        } else {
            0.16
        };
        smoothed_spectrum[band] += (display_level - smoothed_spectrum[band]) * factor;
        spectrum[band].store(smoothed_spectrum[band].to_bits(), Ordering::Relaxed);
    }
}

#[derive(Clone, Copy)]
struct Biquad {
    b0: f32,
    b1: f32,
    b2: f32,
    a1: f32,
    a2: f32,
    z1: f32,
    z2: f32,
}

impl Biquad {
    fn identity() -> Self {
        Self {
            b0: 1.0,
            b1: 0.0,
            b2: 0.0,
            a1: 0.0,
            a2: 0.0,
            z1: 0.0,
            z2: 0.0,
        }
    }

    fn peaking(sample_rate: u32, frequency: f32, q: f32, gain_db: f32) -> Self {
        if sample_rate == 0 || gain_db.abs() < 0.05 {
            return Self::identity();
        }

        let sample_rate = sample_rate as f32;
        let nyquist = sample_rate / 2.0;
        let frequency = frequency.clamp(20.0, nyquist * 0.92);
        let omega = 2.0 * std::f32::consts::PI * frequency / sample_rate;
        let sin = omega.sin();
        let cos = omega.cos();
        let alpha = sin / (2.0 * q.max(0.1));
        let a = 10.0f32.powf(gain_db / 40.0);

        let b0 = 1.0 + alpha * a;
        let b1 = -2.0 * cos;
        let b2 = 1.0 - alpha * a;
        let a0 = 1.0 + alpha / a;
        let a1 = -2.0 * cos;
        let a2 = 1.0 - alpha / a;

        Self {
            b0: b0 / a0,
            b1: b1 / a0,
            b2: b2 / a0,
            a1: a1 / a0,
            a2: a2 / a0,
            z1: 0.0,
            z2: 0.0,
        }
    }

    fn process(&mut self, sample: f32) -> f32 {
        let out = self.b0 * sample + self.z1;
        self.z1 = self.b1 * sample - self.a1 * out + self.z2;
        self.z2 = self.b2 * sample - self.a2 * out;
        out
    }
}

struct EqualizerProcessor {
    dsp: Arc<DspState>,
    sample_rate: u32,
    channel_count: usize,
    cached_version: u64,
    filters: Option<Vec<[Biquad; EQUALIZER_BANDS]>>,
    input_gain: f32,
    next_channel: usize,
}

impl EqualizerProcessor {
    fn new(dsp: Arc<DspState>, sample_rate: u32, channels: u16) -> Self {
        Self {
            dsp,
            sample_rate,
            channel_count: usize::from(channels.max(1)),
            cached_version: u64::MAX,
            filters: None,
            input_gain: 1.0,
            next_channel: 0,
        }
    }

    fn refresh(&mut self) {
        let state = self.dsp.equalizer_state();
        if self.cached_version == state.version {
            return;
        }

        self.cached_version = state.version;
        if state.enabled && !state.gains_db.iter().all(|gain| gain.abs() < 0.05) {
            self.input_gain = equalizer_headroom_factor(&state.gains_db);
            self.filters = Some(
                (0..self.channel_count)
                    .map(|_| build_equalizer_filters(self.sample_rate, &state.gains_db))
                    .collect(),
            );
            self.next_channel = 0;
        } else {
            self.input_gain = 1.0;
            self.filters = None;
        }
    }

    fn process(&mut self, mut sample: f32) -> f32 {
        self.refresh();

        if let Some(filters) = self.filters.as_mut() {
            sample *= self.input_gain;
            let channel = self.next_channel.min(filters.len().saturating_sub(1));
            for filter in &mut filters[channel] {
                sample = filter.process(sample);
            }

            self.next_channel = (self.next_channel + 1) % filters.len().max(1);
        }

        sample
    }
}

fn build_equalizer_filters(
    sample_rate: u32,
    gains_db: &[f32; EQUALIZER_BANDS],
) -> [Biquad; EQUALIZER_BANDS] {
    std::array::from_fn(|index| {
        Biquad::peaking(
            sample_rate,
            EQUALIZER_BAND_CENTERS[index],
            EQUALIZER_Q,
            gains_db[index],
        )
    })
}

pub(super) fn normalize_equalizer_gains(gains_db: Vec<f32>) -> [f32; EQUALIZER_BANDS] {
    std::array::from_fn(|index| {
        gains_db
            .get(index)
            .copied()
            .unwrap_or(0.0)
            .clamp(-EQUALIZER_GAIN_LIMIT_DB, EQUALIZER_GAIN_LIMIT_DB)
    })
}

fn db_to_factor(db: f32) -> f32 {
    10.0f32.powf(db / 20.0)
}

fn equalizer_headroom_factor(gains_db: &[f32; EQUALIZER_BANDS]) -> f32 {
    let max_boost_db = gains_db
        .iter()
        .copied()
        .fold(0.0f32, |max_boost, gain| max_boost.max(gain.max(0.0)));

    db_to_factor(-max_boost_db)
}

fn soft_limit_sample(sample: f32) -> f32 {
    if !sample.is_finite() {
        return 0.0;
    }

    let abs = sample.abs();
    if abs <= OUTPUT_LIMITER_THRESHOLD {
        return sample;
    }

    let sign = sample.signum();
    let knee = 1.0 - OUTPUT_LIMITER_THRESHOLD;
    let excess = abs - OUTPUT_LIMITER_THRESHOLD;
    let limited = OUTPUT_LIMITER_THRESHOLD + excess / (1.0 + excess / knee.max(f32::EPSILON));

    (sign * limited).clamp(-1.0, 1.0)
}

pub(super) fn replay_gain_factor(
    info: Option<ReplayGainInfo>,
    enabled: bool,
    preamp_db: f32,
) -> f32 {
    if !enabled {
        return 1.0;
    }

    let preamp_db = preamp_db.clamp(-12.0, 12.0);
    let Some(info) = info else {
        return db_to_factor(preamp_db).clamp(0.0, REPLAY_GAIN_MAX_FACTOR);
    };

    let mut factor = db_to_factor(info.gain_db + preamp_db);
    if let Some(peak) = info.peak {
        if peak.is_finite() && peak > 0.0 {
            factor = factor.min(1.0 / peak);
        }
    }

    factor.clamp(0.0, REPLAY_GAIN_MAX_FACTOR)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;

    #[test]
    fn replay_gain_factor_respects_disabled_state() {
        let info = Some(ReplayGainInfo {
            gain_db: -8.0,
            peak: Some(0.9),
        });

        assert_eq!(replay_gain_factor(info, false, 0.0), 1.0);
        assert_eq!(replay_gain_factor(None, true, 0.0), 1.0);
    }

    #[test]
    fn replay_gain_factor_uses_peak_for_clipping_protection() {
        let info = Some(ReplayGainInfo {
            gain_db: 12.0,
            peak: Some(0.8),
        });

        let factor = replay_gain_factor(info, true, 0.0);
        assert!((factor - 1.25).abs() < 0.001);
    }

    #[test]
    fn replay_gain_preamp_applies_without_replay_gain_tags() {
        let factor = replay_gain_factor(None, true, -6.0);
        assert!((factor - 10.0f32.powf(-6.0 / 20.0)).abs() < 0.001);
    }

    #[test]
    fn normalizes_equalizer_gains_to_fixed_band_count() {
        let gains = normalize_equalizer_gains(vec![-20.0, -6.0, 0.0, 6.0, 20.0, 3.0]);

        assert_eq!(gains, [-12.0, -6.0, 0.0, 6.0, 12.0]);
    }

    #[test]
    fn equalizer_boosts_apply_input_headroom() {
        let gains = [6.0, 4.0, 1.0, 0.0, 0.0];
        let factor = equalizer_headroom_factor(&gains);
        assert!((factor - 10.0f32.powf(-6.0 / 20.0)).abs() < 0.001);
    }

    #[test]
    fn soft_limiter_avoids_hard_clipping() {
        assert_eq!(soft_limit_sample(0.5), 0.5);
        assert!(soft_limit_sample(1.5) < 1.0);
        assert!(soft_limit_sample(1.5) > OUTPUT_LIMITER_THRESHOLD);
        assert_eq!(soft_limit_sample(f32::NAN), 0.0);
    }

    #[test]
    fn dsp_state_normalizes_runtime_updates() {
        let dsp = DspState::new();
        let initial_replay_gain = dsp.replay_gain_state();

        dsp.set_replay_gain(false, 99.0);
        let replay_gain = dsp.replay_gain_state();
        assert!(!replay_gain.enabled);
        assert_eq!(replay_gain.preamp_db, 12.0);
        assert!(replay_gain.version > initial_replay_gain.version);

        dsp.set_equalizer(true, vec![20.0, -20.0]);
        let equalizer = dsp.equalizer_state();
        assert!(equalizer.enabled);
        assert_eq!(equalizer.gains_db, [12.0, -12.0, 0.0, 0.0, 0.0]);
    }

    #[test]
    fn disabled_or_flat_equalizer_skips_processor() {
        let dsp = Arc::new(DspState::new());
        let mut processor = EqualizerProcessor::new(Arc::clone(&dsp), 44100, 2);
        assert_eq!(processor.process(0.25), 0.25);

        dsp.set_equalizer(true, vec![0.0; EQUALIZER_BANDS]);
        assert_eq!(processor.process(-0.25), -0.25);
    }

    #[test]
    fn equalizer_processor_picks_up_runtime_updates() {
        let dsp = Arc::new(DspState::new());
        let mut processor = EqualizerProcessor::new(Arc::clone(&dsp), 44100, 2);
        assert!(processor.filters.is_none());

        dsp.set_equalizer(true, vec![3.0, -2.0, 0.0, 4.0, -3.0]);
        assert!(processor.process(0.25).is_finite());
        assert!(processor.filters.is_some());

        dsp.set_equalizer(false, vec![3.0, -2.0, 0.0, 4.0, -3.0]);
        assert_eq!(processor.process(0.25), 0.25);
        assert!(processor.filters.is_none());
    }

    #[test]
    fn equalizer_processor_keeps_samples_finite() {
        let dsp = Arc::new(DspState::new());
        dsp.set_equalizer(true, vec![3.0, -2.0, 0.0, 4.0, -3.0]);
        let mut processor = EqualizerProcessor::new(dsp, 44100, 2);

        for index in 0..512 {
            let input = if index % 2 == 0 { 0.25 } else { -0.25 };
            assert!(processor.process(input).is_finite());
        }
    }
}
