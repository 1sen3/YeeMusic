use std::sync::{Arc, Mutex};

use tauri::{AppHandle, Emitter};

use super::command::ResponseTx;
use super::snapshot::store_snapshot;
use super::types::{AudioEvent, AudioSnapshot};

const PLAYER_EVENT: &str = "native-player-event";

pub(super) fn respond_and_emit(
    app: &AppHandle,
    kind: &str,
    result: Result<AudioSnapshot, String>,
    respond_to: ResponseTx,
    snapshot_state: &Arc<Mutex<AudioSnapshot>>,
) {
    if let Ok(snapshot) = &result {
        store_snapshot(snapshot_state, snapshot.clone());
        emit_snapshot(app, kind, snapshot.clone());
    }
    let _ = respond_to.send(result);
}

pub(super) fn emit_snapshot(app: &AppHandle, kind: &str, snapshot: AudioSnapshot) {
    let _ = app.emit(PLAYER_EVENT, AudioEvent::snapshot(kind, snapshot));
}
