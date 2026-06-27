use std::{sync::mpsc, time::Duration};

use tauri::AppHandle;

use super::source::AudioSource;
use super::types::AudioSnapshot;

pub(super) enum AudioCommand {
    BeginLoad {
        app: AppHandle,
        request_id: u64,
        respond_to: ResponseTx,
    },
    Load {
        app: AppHandle,
        source: AudioSource,
        autoplay: bool,
        request_id: u64,
        respond_to: ResponseTx,
    },
    Play {
        app: AppHandle,
        respond_to: ResponseTx,
    },
    Pause {
        app: AppHandle,
        respond_to: ResponseTx,
    },
    Seek {
        app: AppHandle,
        position: Duration,
        respond_to: ResponseTx,
    },
    SetVolume {
        app: AppHandle,
        volume: f32,
        respond_to: ResponseTx,
    },
    Stop {
        app: AppHandle,
        request_id: u64,
        respond_to: ResponseTx,
    },
    SetOutputDevice {
        app: AppHandle,
        device_id: Option<String>,
        respond_to: ResponseTx,
    },
    SetReplayGain {
        app: AppHandle,
        enabled: bool,
        preamp_db: f32,
        respond_to: ResponseTx,
    },
    SetEqualizer {
        app: AppHandle,
        enabled: bool,
        gains_db: Vec<f32>,
        respond_to: ResponseTx,
    },
    SetCrossfade {
        app: AppHandle,
        duration: Duration,
        respond_to: ResponseTx,
    },
}

pub(super) type ResponseTx = mpsc::Sender<Result<AudioSnapshot, String>>;
