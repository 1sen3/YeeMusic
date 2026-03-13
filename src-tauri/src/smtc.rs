use std::sync::Mutex;
use souvlaki::{
  MediaControls, MediaControlEvent, MediaMetadata, MediaPlayback, MediaPosition, PlatformConfig,
};
use tauri::{ AppHandle, Emitter, Manager };

static CONTROLS:Mutex<Option<MediaControls>> = Mutex::new(None);

// 从 Tauri 窗口获取 HWND 并初始化 SMTC
pub fn init_smtc(app: &AppHandle) {
    let window = app.get_webview_window("main").expect("Failed to get main window");

let hwnd = {
        use raw_window_handle::HasWindowHandle;
        let raw = window.window_handle().expect("Failed to get window handle");
        match raw.as_raw() {
            raw_window_handle::RawWindowHandle::Win32(h) => {
                Some(h.hwnd.get() as *mut std::ffi::c_void)
            }
            _ => None,
        }
    };
    let config = PlatformConfig {
        dbus_name: "yee_music",
        display_name: "Yee Music",
        hwnd,
    };
    let mut controls = MediaControls::new(config).expect("Failed to create MediaControls");

    let app_handle = app.clone();
    controls
        .attach(move |event: MediaControlEvent| {
            let event_name = match event {
                MediaControlEvent::Play => "play",
                MediaControlEvent::Pause => "pause",
                MediaControlEvent::Toggle => "toggle",
                MediaControlEvent::Next => "next",
                MediaControlEvent::Previous => "previous",
                MediaControlEvent::Stop => "stop",
                MediaControlEvent::SetPosition(pos) => {
                    let secs = pos.0.as_secs_f64();
                    let _ = app_handle.emit("smtc-event", serde_json::json!({
                        "event": "set_position",
                        "position": secs,
                    }));
                    return;
                }
                _ => return,
            };
            let _ = app_handle.emit("smtc-event", serde_json::json!({
                "event": event_name,
            }));
        })
        .expect("Failed to attach SMTC event");
    *CONTROLS.lock().unwrap() = Some(controls);
}

#[tauri::command]
pub fn smtc_update_metadata(title: String, artist: String, album: String, cover_url: String, duration_secs: f64) {
  if let Some(controls) = CONTROLS.lock().unwrap().as_mut() {
    let _ = controls.set_metadata(MediaMetadata {
      title: Some(&title),
      artist: Some(&artist),
      album: Some(&album),
      cover_url: Some(&cover_url),
      duration: Some(std::time::Duration::from_secs_f64(duration_secs)),
    });
  }
}

#[tauri::command]
pub fn smtc_update_playback(is_playing: bool, position_secs: f64, duration_secs: f64) {
  if let Some(controls) = CONTROLS.lock().unwrap().as_mut() {
    let progress = if duration_secs > 0.0 {
      Some(MediaPosition(std::time::Duration::from_secs_f64(
        position_secs,
      )))
    } else {
      None
    };

    let playback = if is_playing {
      MediaPlayback::Playing {
        progress
      }
    } else {
      MediaPlayback::Paused {
        progress
      }
    };

    let _ = controls.set_playback(playback);
  }

  crate::thumbbar::update_play_state(is_playing);
}