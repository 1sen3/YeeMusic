use reqwest::header::CONTENT_TYPE;
use rodio::{
    decoder::{DecoderError, Mp4Type},
    Decoder,
};
use std::{
    io::{self, ErrorKind, Read, Seek, SeekFrom},
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc, Condvar, Mutex,
    },
    time::Duration,
};

struct StreamingState {
    data: Vec<u8>,
    complete: bool,
    error: Option<String>,
}

pub(super) struct StreamingBuffer {
    state: Mutex<StreamingState>,
    available: Condvar,
}

impl StreamingBuffer {
    pub(super) fn new() -> Arc<Self> {
        Arc::new(Self {
            state: Mutex::new(StreamingState {
                data: Vec::new(),
                complete: false,
                error: None,
            }),
            available: Condvar::new(),
        })
    }

    pub(super) fn append(&self, chunk: &[u8]) -> Result<(), String> {
        let mut state = self
            .state
            .lock()
            .map_err(|_| "streaming audio buffer lock poisoned".to_string())?;
        state.data.extend_from_slice(chunk);
        self.available.notify_all();
        Ok(())
    }

    pub(super) fn finish(&self) {
        if let Ok(mut state) = self.state.lock() {
            state.complete = true;
            self.available.notify_all();
        }
    }

    pub(super) fn fail(&self, message: String) {
        if let Ok(mut state) = self.state.lock() {
            state.error = Some(message);
            state.complete = true;
            self.available.notify_all();
        }
    }
}

#[derive(Clone)]
pub(super) struct StreamingReader {
    shared: Arc<StreamingBuffer>,
    latest_request_id: Arc<AtomicU64>,
    request_id: u64,
    position: u64,
}

impl StreamingReader {
    pub(super) fn new(
        shared: Arc<StreamingBuffer>,
        latest_request_id: Arc<AtomicU64>,
        request_id: u64,
    ) -> Self {
        Self {
            shared,
            latest_request_id,
            request_id,
            position: 0,
        }
    }

    fn is_cancelled(&self) -> bool {
        self.latest_request_id.load(Ordering::SeqCst) != self.request_id
    }

    fn cancelled_error() -> io::Error {
        io::Error::new(ErrorKind::Interrupted, "streaming audio load cancelled")
    }
}

impl Read for StreamingReader {
    fn read(&mut self, output: &mut [u8]) -> io::Result<usize> {
        if output.is_empty() {
            return Ok(0);
        }

        let mut state = self
            .shared
            .state
            .lock()
            .map_err(|_| io::Error::new(ErrorKind::Other, "streaming audio buffer poisoned"))?;

        loop {
            if self.is_cancelled() {
                return Err(Self::cancelled_error());
            }

            if self.position < state.data.len() as u64 {
                let start = self.position as usize;
                let end = (start + output.len()).min(state.data.len());
                let read_len = end - start;
                output[..read_len].copy_from_slice(&state.data[start..end]);
                self.position += read_len as u64;
                return Ok(read_len);
            }

            if let Some(error) = state.error.clone() {
                return Err(io::Error::new(ErrorKind::Other, error));
            }

            if state.complete {
                return Ok(0);
            }

            let (next_state, _) = self
                .shared
                .available
                .wait_timeout(state, Duration::from_millis(250))
                .map_err(|_| io::Error::new(ErrorKind::Other, "streaming audio buffer poisoned"))?;
            state = next_state;
        }
    }
}

impl Seek for StreamingReader {
    fn seek(&mut self, position: SeekFrom) -> io::Result<u64> {
        let target = match position {
            SeekFrom::Start(position) => position as i128,
            SeekFrom::Current(offset) => self.position as i128 + offset as i128,
            SeekFrom::End(offset) => {
                let mut state = self.shared.state.lock().map_err(|_| {
                    io::Error::new(ErrorKind::Other, "streaming audio buffer poisoned")
                })?;
                while !state.complete {
                    if self.is_cancelled() {
                        return Err(Self::cancelled_error());
                    }
                    if let Some(error) = state.error.clone() {
                        return Err(io::Error::new(ErrorKind::Other, error));
                    }
                    let (next_state, _) = self
                        .shared
                        .available
                        .wait_timeout(state, Duration::from_millis(250))
                        .map_err(|_| {
                            io::Error::new(ErrorKind::Other, "streaming audio buffer poisoned")
                        })?;
                    state = next_state;
                }
                state.data.len() as i128 + offset as i128
            }
        };

        if target < 0 {
            return Err(io::Error::new(
                ErrorKind::InvalidInput,
                "cannot seek before start of audio stream",
            ));
        }

        self.position = target as u64;
        Ok(self.position)
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(super) enum StreamFormat {
    Mp3,
    Flac,
    OggVorbis,
    Wav,
    Aac,
    Mp4,
    M4a,
}

impl StreamFormat {
    pub(super) fn label(self) -> &'static str {
        match self {
            StreamFormat::Mp3 => "mp3",
            StreamFormat::Flac => "flac",
            StreamFormat::OggVorbis => "ogg/vorbis",
            StreamFormat::Wav => "wav",
            StreamFormat::Aac => "aac",
            StreamFormat::Mp4 => "mp4",
            StreamFormat::M4a => "m4a",
        }
    }
}

pub(super) fn decode_streaming_reader(
    reader: StreamingReader,
    format: StreamFormat,
) -> Result<Decoder<StreamingReader>, DecoderError> {
    match format {
        StreamFormat::Mp3 => Decoder::new_mp3(reader),
        StreamFormat::Flac => Decoder::new_flac(reader),
        StreamFormat::OggVorbis => Decoder::new_vorbis(reader),
        StreamFormat::Wav => Decoder::new_wav(reader),
        StreamFormat::Aac => Decoder::new_aac(reader),
        StreamFormat::Mp4 => Decoder::new_mp4(reader, Mp4Type::Mp4),
        StreamFormat::M4a => Decoder::new_mp4(reader, Mp4Type::M4a),
    }
}

pub(super) fn content_type(headers: &reqwest::header::HeaderMap) -> Option<String> {
    headers
        .get(CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .map(str::to_string)
}

pub(super) fn detect_stream_format(
    url: &str,
    content_type: Option<&str>,
    first_chunk: &[u8],
) -> Option<StreamFormat> {
    match extract_remote_ext(url) {
        "mp3" => return Some(StreamFormat::Mp3),
        "flac" => return Some(StreamFormat::Flac),
        "wav" => return Some(StreamFormat::Wav),
        "aac" => return Some(StreamFormat::Aac),
        "mp4" => return Some(StreamFormat::Mp4),
        "m4a" => return Some(StreamFormat::M4a),
        _ => {}
    }

    if let Some(format) = content_type.and_then(stream_format_from_content_type) {
        return Some(format);
    }

    if looks_like_aac_adts(first_chunk) {
        return Some(StreamFormat::Aac);
    }
    if first_chunk.starts_with(b"fLaC") {
        return Some(StreamFormat::Flac);
    }
    if looks_like_ogg_vorbis(first_chunk) {
        return Some(StreamFormat::OggVorbis);
    }
    if first_chunk.len() >= 12 && first_chunk.starts_with(b"RIFF") && &first_chunk[8..12] == b"WAVE"
    {
        return Some(StreamFormat::Wav);
    }
    if looks_like_iso_bmff(first_chunk) {
        return Some(StreamFormat::M4a);
    }
    if looks_like_mp3(first_chunk) {
        return Some(StreamFormat::Mp3);
    }

    None
}

pub(super) fn remote_cache_file_name(url: &str) -> String {
    use std::{
        collections::hash_map::DefaultHasher,
        hash::{Hash, Hasher},
    };

    let mut hasher = DefaultHasher::new();
    url.hash(&mut hasher);
    let hash = hasher.finish();
    format!("{hash:016x}.{}", extract_remote_ext(url))
}

fn extract_remote_ext(url: &str) -> &str {
    let path = url.split('?').next().unwrap_or(url);
    let ext = path.rsplit('.').next().unwrap_or("audio");
    match ext.to_ascii_lowercase().as_str() {
        "mp3" => "mp3",
        "flac" => "flac",
        "m4a" | "m4b" | "m4p" | "m4r" => "m4a",
        "mp4" => "mp4",
        "aac" => "aac",
        "wav" => "wav",
        "ogg" => "ogg",
        _ => "audio",
    }
}

fn stream_format_from_content_type(content_type: &str) -> Option<StreamFormat> {
    let content_type = content_type.to_ascii_lowercase();
    let mime = content_type
        .split(';')
        .next()
        .unwrap_or(content_type.as_str())
        .trim();

    match mime {
        "audio/mpeg" | "audio/mp3" | "audio/x-mpeg" => Some(StreamFormat::Mp3),
        "audio/flac" | "audio/x-flac" => Some(StreamFormat::Flac),
        "audio/vorbis" => Some(StreamFormat::OggVorbis),
        "audio/wav" | "audio/wave" | "audio/x-wav" | "audio/vnd.wave" => Some(StreamFormat::Wav),
        "audio/aac" | "audio/aacp" | "audio/x-aac" => Some(StreamFormat::Aac),
        "audio/mp4" | "audio/x-m4a" | "audio/m4a" => Some(StreamFormat::M4a),
        "video/mp4" | "application/mp4" => Some(StreamFormat::Mp4),
        _ => None,
    }
}

fn looks_like_mp3(bytes: &[u8]) -> bool {
    bytes.starts_with(b"ID3")
        || bytes.windows(2).take(512).any(|window| {
            window[0] == 0xff
                && (window[1] & 0xe0) == 0xe0
                && (window[1] & 0x18) != 0x08
                && (window[1] & 0x06) != 0x00
        })
}

fn looks_like_aac_adts(bytes: &[u8]) -> bool {
    bytes
        .windows(2)
        .take(512)
        .any(|window| window[0] == 0xff && (window[1] & 0xf6) == 0xf0)
}

fn looks_like_ogg_vorbis(bytes: &[u8]) -> bool {
    bytes.starts_with(b"OggS") && bytes.windows(6).take(512).any(|window| window == b"vorbis")
}

fn looks_like_iso_bmff(bytes: &[u8]) -> bool {
    bytes.len() >= 12 && &bytes[4..8] == b"ftyp"
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn streaming_reader_reads_and_seeks_buffered_data() {
        let shared = StreamingBuffer::new();
        shared.append(b"abcdef").expect("append should succeed");
        shared.finish();
        let latest_request_id = Arc::new(AtomicU64::new(1));

        let mut reader = StreamingReader::new(shared, latest_request_id, 1);
        let mut output = [0u8; 3];
        assert_eq!(reader.read(&mut output).expect("read should succeed"), 3);
        assert_eq!(&output, b"abc");

        assert_eq!(
            reader
                .seek(SeekFrom::Start(2))
                .expect("seek should succeed"),
            2
        );

        let mut output = [0u8; 4];
        assert_eq!(reader.read(&mut output).expect("read should succeed"), 4);
        assert_eq!(&output, b"cdef");
        assert_eq!(reader.read(&mut output).expect("eof should succeed"), 0);
    }

    #[test]
    fn streaming_reader_stops_waiting_when_request_is_stale() {
        let shared = StreamingBuffer::new();
        let latest_request_id = Arc::new(AtomicU64::new(2));
        let mut reader = StreamingReader::new(shared, latest_request_id, 1);
        let mut output = [0u8; 4];

        let error = reader
            .read(&mut output)
            .expect_err("stale request should cancel read");
        assert_eq!(error.kind(), ErrorKind::Interrupted);
    }

    #[test]
    fn stream_format_detection_uses_url_content_type_and_bytes() {
        assert_eq!(
            detect_stream_format(
                "https://example.test/song.mp3?token=abc",
                None,
                b"not enough data"
            ),
            Some(StreamFormat::Mp3)
        );
        assert_eq!(
            detect_stream_format(
                "https://example.test/play?id=1",
                Some("audio/mpeg"),
                b"not enough data"
            ),
            Some(StreamFormat::Mp3)
        );
        assert_eq!(
            detect_stream_format("https://example.test/play?id=1", None, b"ID3\x04\x00\x00"),
            Some(StreamFormat::Mp3)
        );
        assert_eq!(
            detect_stream_format(
                "https://example.test/play?id=1",
                None,
                &[0x00, 0xff, 0xfb, 0x90, 0x64]
            ),
            Some(StreamFormat::Mp3)
        );
        assert_eq!(
            detect_stream_format(
                "https://example.test/play?id=4",
                Some("audio/aac"),
                &[0xff, 0xf1, 0x50, 0x80]
            ),
            Some(StreamFormat::Aac)
        );
        assert_eq!(
            detect_stream_format(
                "https://example.test/song.m4a?token=abc",
                None,
                b"\x00\x00\x00\x20ftypM4A "
            ),
            Some(StreamFormat::M4a)
        );
        assert_eq!(
            detect_stream_format(
                "https://example.test/play?id=5",
                Some("audio/mp4; codecs=mp4a.40.2"),
                b"\x00\x00\x00\x18ftypisom"
            ),
            Some(StreamFormat::M4a)
        );
        assert_eq!(
            detect_stream_format(
                "https://example.test/play?id=6",
                None,
                b"\x00\x00\x00\x18ftypisom"
            ),
            Some(StreamFormat::M4a)
        );
        assert_eq!(
            detect_stream_format(
                "https://example.test/song.flac",
                Some("audio/flac"),
                b"fLaC"
            ),
            Some(StreamFormat::Flac)
        );
        assert_eq!(
            detect_stream_format(
                "https://example.test/play?id=2",
                Some("audio/vorbis"),
                b"OggS\x00\x00\x00vorbis"
            ),
            Some(StreamFormat::OggVorbis)
        );
        assert_eq!(
            detect_stream_format(
                "https://example.test/play?id=2",
                Some("application/ogg"),
                b"OggS\x00\x00\x00OpusHead"
            ),
            None
        );
        assert_eq!(
            detect_stream_format(
                "https://example.test/play?id=3",
                Some("audio/wav"),
                b"RIFF\x00\x00\x00\x00WAVEfmt "
            ),
            Some(StreamFormat::Wav)
        );
        assert_eq!(
            detect_stream_format(
                "https://example.test/cover.jpg",
                Some("image/jpeg"),
                b"\xff\xd8\xff"
            ),
            None
        );
    }
}
