mod download;
mod local_music;
mod smtc;
mod thumbbar;

use percent_encoding::percent_decode_str;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    std::env::set_var(
        "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
        "--disable-features=HardwareMediaKeyHandling",
    );

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.emit("app-foreground", ());
            }
        }))
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .register_uri_scheme_protocol("localmusic", |_app, request| {
            let uri = request.uri().to_string();
            let encoded_path = uri.strip_prefix("localmusic://localhost/").unwrap_or("");
            let path = percent_decode_str(encoded_path)
                .decode_utf8_lossy()
                .to_string();

            match std::fs::read(&path) {
                Ok(file_bytes) => {
                    let mime = match path
                        .rsplit('.')
                        .next()
                        .unwrap_or("")
                        .to_lowercase()
                        .as_str()
                    {
                        "mp3" => "audio/mpeg",
                        "flac" => "audio/flac",
                        "m4a" | "aac" => "audio/mp4",
                        "wav" => "audio/wav",
                        "ogg" => "audio/ogg",
                        "wma" => "audio/x-ms-wma",
                        _ => "application/octet-stream",
                    };
                    tauri::http::Response::builder()
                        .header("Content-Type", mime)
                        .header("Access-Control-Allow-Origin", "*")
                        .body(file_bytes)
                        .unwrap()
                }
                Err(e) => tauri::http::Response::builder()
                    .status(404)
                    .body(format!("File not found: {}", e).into_bytes())
                    .unwrap(),
            }
        })
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
            }

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Yee Music")
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = window.emit("app-foreground", ());
                        }
                    }
                    TrayIconEvent::Click {
                        button: MouseButton::Right,
                        button_state: MouseButtonState::Up,
                        position,
                        ..
                    } => {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("tray-menu") {
                            let size = window.outer_size().unwrap();
                            let adjusted_pos = tauri::PhysicalPosition {
                                x: position.x - (size.width as f64 / 2.0),   // 居中于鼠标
                                y: position.y - (size.height as f64) - 10.0, // 在鼠标上方显示（针对底部任务栏）
                            };
                            let _ = window.set_position(tauri::Position::Physical(
                                tauri::PhysicalPosition {
                                    x: adjusted_pos.x as i32,
                                    y: adjusted_pos.y as i32,
                                },
                            ));
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            smtc::init_smtc(app.handle());

            let window = app
                .get_webview_window("main")
                .expect("Failed to get main window");
            let hwnd = {
                use raw_window_handle::HasWindowHandle;
                let raw = window.window_handle().expect("Failed to get window handle");
                match raw.as_raw() {
                    raw_window_handle::RawWindowHandle::Win32(h) => {
                        windows::Win32::Foundation::HWND(h.hwnd.get() as isize)
                    }
                    _ => panic!("Not a Win32 window"),
                }
            };
            thumbbar::setup(hwnd, app.handle().clone());

            Ok(())
        })
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                let _ = window.emit("app-background", ());

                std::thread::spawn({
                    let window = window.clone();
                    move || {
                        std::thread::sleep(std::time::Duration::from_millis(50));
                        let _ = window.hide();
                    }
                });
            }
            WindowEvent::Focused(focused) => {
                if !focused && window.label() == "tray-menu" {
                    let _ = window.hide();
                }
            }
            _ => {}
        })
        .manage(download::new_registry())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            smtc::smtc_update_metadata,
            smtc::smtc_update_playback,
            download::get_default_download_dir,
            download::ensure_dir_exists,
            download::download_song,
            download::pause_download,
            local_music::scan_local_music,
            local_music::get_default_music_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
