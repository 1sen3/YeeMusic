use rodio::cpal::{
    self,
    traits::{DeviceTrait, HostTrait},
};
use rodio::{OutputStream, OutputStreamHandle};
use serde::Serialize;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioDeviceInfo {
    id: String,
    name: String,
    is_default: bool,
}

pub(super) fn normalize_device_id(device_id: Option<String>) -> Option<String> {
    device_id
        .map(|id| id.trim().to_string())
        .filter(|id| !id.is_empty() && id != "default")
}

fn selected_device_index(device_id: Option<&str>) -> Result<Option<usize>, String> {
    let Some(device_id) = device_id else {
        return Ok(None);
    };
    let Some(index) = device_id.strip_prefix("device:") else {
        return Err(format!("unknown audio output device id: {device_id}"));
    };

    index
        .parse::<usize>()
        .map(Some)
        .map_err(|_| format!("invalid audio output device id: {device_id}"))
}

pub(super) fn open_output(
    device_id: Option<&str>,
) -> Result<(OutputStream, OutputStreamHandle), String> {
    let Some(index) = selected_device_index(device_id)? else {
        return OutputStream::try_default()
            .map_err(|err| format!("open default audio output failed: {err}"));
    };

    let host = cpal::default_host();
    let mut devices = host
        .output_devices()
        .map_err(|err| format!("list audio output devices failed: {err}"))?;
    let device = devices
        .nth(index)
        .ok_or_else(|| format!("audio output device not found: device:{index}"))?;
    let device_name = device.name().unwrap_or_else(|_| format!("device:{index}"));

    OutputStream::try_from_device(&device)
        .map_err(|err| format!("open audio output {device_name} failed: {err}"))
}

pub(super) fn list_output_devices() -> Result<Vec<AudioDeviceInfo>, String> {
    let host = cpal::default_host();
    let default_device_name = host
        .default_output_device()
        .and_then(|device| device.name().ok());

    let mut devices = vec![AudioDeviceInfo {
        id: "default".to_string(),
        name: default_device_name
            .as_ref()
            .map(|name| format!("System default ({name})"))
            .unwrap_or_else(|| "System default".to_string()),
        is_default: true,
    }];

    for (index, device) in host
        .output_devices()
        .map_err(|err| format!("list audio output devices failed: {err}"))?
        .enumerate()
    {
        let name = device
            .name()
            .unwrap_or_else(|_| format!("Output device {}", index + 1));
        let is_default = default_device_name
            .as_ref()
            .map(|default_name| default_name == &name)
            .unwrap_or(false);

        devices.push(AudioDeviceInfo {
            id: format!("device:{index}"),
            name,
            is_default,
        });
    }

    Ok(devices)
}
