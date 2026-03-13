use std::sync::{
    atomic::{AtomicU32, Ordering},
    Mutex,
};
use tauri::{AppHandle, Emitter};
use windows::{
    core::*,
    Win32::{
        Foundation::*,
        Graphics::Gdi::*,
        Graphics::Imaging::*,
        System::Com::*,
        UI::{Shell::*, WindowsAndMessaging::*},
    },
};
const BTN_PREV: u32 = 0;
const BTN_PLAY: u32 = 1;
const BTN_NEXT: u32 = 2;
static TASKBAR_MSG_ID: AtomicU32 = AtomicU32::new(0);
static APP_HANDLE: Mutex<Option<AppHandle>> = Mutex::new(None);
static LAST_PLAY_STATE: Mutex<Option<bool>> = Mutex::new(None);
struct Thumbbar {
    taskbar: ITaskbarList3,
    hwnd: HWND,
    play_icon: HICON,
    pause_icon: HICON,
}
unsafe impl Send for Thumbbar {}
unsafe impl Sync for Thumbbar {}
static THUMBBAR: Mutex<Option<Thumbbar>> = Mutex::new(None);
pub fn setup(hwnd: HWND, app_handle: AppHandle) {
    *APP_HANDLE.lock().unwrap() = Some(app_handle);
    unsafe {
        let msg_id = RegisterWindowMessageW(w!("TaskbarButtonCreated"));
        TASKBAR_MSG_ID.store(msg_id, Ordering::SeqCst);
        let _ = SetWindowSubclass(hwnd, Some(subclass_proc), 1, 0);
        init_thumbbar(hwnd);
    }
}
pub fn update_play_state(is_playing: bool) {
    {
        let mut last = LAST_PLAY_STATE.lock().unwrap();
        if Some(is_playing) == *last {
            return;
        }
        *last = Some(is_playing);
    }
    if let Some(tb) = THUMBBAR.lock().unwrap().as_ref() {
        let icon = if is_playing {
            tb.pause_icon
        } else {
            tb.play_icon
        };
        let tip = if is_playing { "暂停" } else { "播放" };
        let mut btn = THUMBBUTTON::default();
        btn.dwMask = THUMBBUTTONMASK(THB_ICON.0 | THB_TOOLTIP.0 | THB_FLAGS.0);
        btn.iId = BTN_PLAY;
        btn.hIcon = icon;
        btn.szTip = str_to_wide_fixed(tip);
        btn.dwFlags = THUMBBUTTONFLAGS(0);
        unsafe {
            let _ = tb.taskbar.ThumbBarUpdateButtons(tb.hwnd, &[btn]);
        }
    }
}
unsafe fn init_thumbbar(hwnd: HWND) {
    if THUMBBAR.lock().unwrap().is_some() {
        return;
    }
    let Ok(taskbar): Result<ITaskbarList3> = CoCreateInstance(&TaskbarList, None, CLSCTX_ALL)
    else {
        return;
    };
    let _ = taskbar.HrInit();

    let prev_icon = load_png_as_hicon("prev.png");
    let play_icon = load_png_as_hicon("play.png");
    let pause_icon = load_png_as_hicon("pause.png");
    let next_icon = load_png_as_hicon("next.png");
    let buttons = [
        make_button(BTN_PREV, prev_icon, "上一首"),
        make_button(BTN_PLAY, play_icon, "播放"),
        make_button(BTN_NEXT, next_icon, "下一首"),
    ];
    if let Ok(_) = taskbar.ThumbBarAddButtons(hwnd, &buttons) {
        *THUMBBAR.lock().unwrap() = Some(Thumbbar {
            taskbar,
            hwnd,
            play_icon,
            pause_icon,
        });
        println!("[Thumbbar] Loaded PNG icons and initialized successfully");
    }
}

unsafe fn load_png_as_hicon(filename: &str) -> HICON {
    let mut path = std::env::current_exe()
        .unwrap()
        .parent()
        .unwrap()
        .join("icons")
        .join(filename);
    if !path.exists() {
        path = std::path::PathBuf::from("icons").join(filename);
    }
    if !path.exists() {
        eprintln!("[Thumbbar] Warning: Icon not found at {:?}", path);
        return HICON(0);
    }
    let Ok(factory): Result<IWICImagingFactory> =
        CoCreateInstance(&CLSID_WICImagingFactory, None, CLSCTX_ALL)
    else {
        return HICON(0);
    };

    let path_str = path.to_str().unwrap();
    let h_path = HSTRING::from(path_str);
    let Ok(decoder) = factory.CreateDecoderFromFilename(
        PCWSTR(h_path.as_ptr()),
        None,
        0x80000000,
        WICDecodeMetadataCacheOnDemand,
    ) else {
        return HICON(0);
    };
    let Ok(frame) = decoder.GetFrame(0) else {
        return HICON(0);
    };
    let Ok(converter) = factory.CreateFormatConverter() else {
        return HICON(0);
    };

    if converter
        .Initialize(
            &frame,
            &GUID_WICPixelFormat32bppPBGRA,
            WICBitmapDitherTypeNone,
            None,
            0.0,
            WICBitmapPaletteTypeCustom,
        )
        .is_err()
    {
        return HICON(0);
    }
    let (mut width, mut height) = (0, 0);
    let _ = converter.GetSize(&mut width, &mut height);
    let mut pixels = vec![0u8; (width * height * 4) as usize];
    let _ = converter.CopyPixels(std::ptr::null(), width * 4, pixels.as_mut_slice());
    let h_bitmap = CreateDIBSection(
        None,
        &BITMAPINFO {
            bmiHeader: BITMAPINFOHEADER {
                biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                biWidth: width as i32,
                biHeight: -(height as i32),
                biPlanes: 1,
                biBitCount: 32,
                biCompression: BI_RGB,
                ..Default::default()
            },
            ..Default::default()
        },
        DIB_RGB_COLORS,
        &mut std::ptr::null_mut(),
        None,
        0,
    )
    .unwrap_or_default();

    std::ptr::copy_nonoverlapping(pixels.as_ptr(), get_dibits_ptr(h_bitmap), pixels.len());

    let h_mask = CreateBitmap(width as i32, height as i32, 1, 1, Some(std::ptr::null()));
    let h_icon = CreateIconIndirect(&ICONINFO {
        fIcon: BOOL(1),
        hbmMask: h_mask,
        hbmColor: h_bitmap,
        ..Default::default()
    })
    .unwrap_or_default();
    let _ = DeleteObject(h_bitmap);
    let _ = DeleteObject(h_mask);
    h_icon
}
unsafe fn get_dibits_ptr(h_bitmap: HBITMAP) -> *mut u8 {
    let mut ds = DIBSECTION::default();
    GetObjectW(
        h_bitmap,
        std::mem::size_of::<DIBSECTION>() as i32,
        Some(&mut ds as *mut _ as *mut _),
    );
    ds.dsBm.bmBits as *mut u8
}

unsafe extern "system" fn subclass_proc(
    hwnd: HWND,
    msg: u32,
    wparam: WPARAM,
    lparam: LPARAM,
    _uid: usize,
    _ref_data: usize,
) -> LRESULT {
    let taskbar_msg = TASKBAR_MSG_ID.load(Ordering::SeqCst);
    if msg == taskbar_msg && taskbar_msg != 0 {
        init_thumbbar(hwnd);
        return LRESULT(0);
    }
    if msg == WM_COMMAND {
        let btn_id = (wparam.0 & 0xFFFF) as u32;
        if let Some(app) = APP_HANDLE.lock().unwrap().as_ref() {
            let evt = match btn_id {
                BTN_PREV => Some("previous"),
                BTN_PLAY => Some("toggle"),
                BTN_NEXT => Some("next"),
                _ => None,
            };
            if let Some(e) = evt {
                let _ = app.emit("smtc-event", serde_json::json!({ "event": e }));
            }
        }
    }
    DefSubclassProc(hwnd, msg, wparam, lparam)
}
fn make_button(id: u32, icon: HICON, tip: &str) -> THUMBBUTTON {
    THUMBBUTTON {
        dwMask: THUMBBUTTONMASK(THB_ICON.0 | THB_TOOLTIP.0 | THB_FLAGS.0),
        iId: id,
        hIcon: icon,
        szTip: str_to_wide_fixed(tip),
        dwFlags: THUMBBUTTONFLAGS(0),
        ..Default::default()
    }
}
fn str_to_wide_fixed(s: &str) -> [u16; 260] {
    let mut buf = [0u16; 260];
    for (i, c) in s.encode_utf16().enumerate() {
        if i >= 259 {
            break;
        }
        buf[i] = c;
    }
    buf
}
