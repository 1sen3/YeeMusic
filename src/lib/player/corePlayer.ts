import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

type TimeListener = (currentTime: number) => void;

interface AudioSnapshot {
	requestId: number;
	isReady: boolean;
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	volume: number;
	source: string | null;
	audioLevel: number;
	audioSpectrum: number[];
	replayGainDb: number | null;
	replayGainApplied: boolean;
	replayGainPreampDb: number;
	equalizerEnabled: boolean;
	equalizerGainsDb: number[];
	crossfadeDuration: number;
}

interface NativePlayerEvent {
	kind: "loaded" | "progress" | "ended" | "state";
	snapshot?: AudioSnapshot;
	message?: string;
}

interface PreloadResult {
	requestId: number;
	isReady: boolean;
	source: string | null;
	duration: number;
}

export interface AudioDeviceInfo {
	id: string;
	name: string;
	isDefault: boolean;
}

class CorePlayer {
	private rafId: number | null = null;
	private unlistenPromise: Promise<UnlistenFn> | null = null;
	private onProgressCallback: ((currentTime: number) => void) | null = null;
	private onEndCallback: (() => void) | null = null;
	private onErrorCallback: (() => void) | null = null;

	private _currentTime = 0;
	private _duration = 0;
	private _isReady = false;
	private _isPlaying = false;
	private anchorTime = 0;
	private anchorUpdatedAt = performance.now();
	private playRequestId = 0;
	private endedRequestId: number | null = null;
	private timeListeners: Set<TimeListener> = new Set();
	private smoothVolume = 0;
	private nativeAudioLevel = 0;
	private nativeSpectrum: number[] = [];
	private replayGainDb: number | null = null;
	private replayGainApplied = false;
	private replayGainPreampDb = 0;
	private equalizerEnabled = false;
	private equalizerGainsDb: number[] = [];
	private crossfadeDuration = 0;
	private fallbackDuration = 0;

	getCurrentTime(): number {
		return this._currentTime;
	}

	getProgress(): number {
		return this._duration > 0 ? (this._currentTime / this._duration) * 100 : 0;
	}

	subscribeTime(listener: TimeListener): () => void {
		this.timeListeners.add(listener);
		return () => {
			this.timeListeners.delete(listener);
		};
	}

	private ensureEventListener() {
		if (this.unlistenPromise) return;

		this.unlistenPromise = listen<NativePlayerEvent>(
			"native-player-event",
			(event) => {
				const { kind, snapshot } = event.payload;
				if (snapshot && !this.applySnapshot(snapshot)) return;

				if (kind === "ended") {
					if (this.endedRequestId === this.playRequestId) return;
					this.endedRequestId = this.playRequestId;
					this.stopProgressLoop();
					this.onEndCallback?.();
				}
			},
		);
	}

	private applySnapshot(snapshot: AudioSnapshot): boolean {
		if (this.playRequestId > 0 && snapshot.requestId !== this.playRequestId) {
			return false;
		}

		this._isReady = snapshot.isReady;
		this._isPlaying = snapshot.isPlaying;
		this._duration =
			snapshot.duration > 0 ? snapshot.duration : this.fallbackDuration;
		this.nativeAudioLevel = snapshot.audioLevel || 0;
		this.nativeSpectrum = Array.isArray(snapshot.audioSpectrum)
			? snapshot.audioSpectrum
			: [];
		this.replayGainDb = snapshot.replayGainDb ?? null;
		this.replayGainApplied = Boolean(snapshot.replayGainApplied);
		this.replayGainPreampDb = snapshot.replayGainPreampDb || 0;
		this.equalizerEnabled = Boolean(snapshot.equalizerEnabled);
		this.equalizerGainsDb = Array.isArray(snapshot.equalizerGainsDb)
			? snapshot.equalizerGainsDb
			: [];
		this.crossfadeDuration = snapshot.crossfadeDuration || 0;
		this.anchorTime = snapshot.currentTime || 0;
		this.anchorUpdatedAt = performance.now();
		this._currentTime = this.anchorTime;

		if (this._isPlaying) this.startProgressLoop();
		else this.stopProgressLoop();

		return true;
	}

	private getInterpolatedTime() {
		if (!this._isPlaying) return this.anchorTime;

		const elapsed = (performance.now() - this.anchorUpdatedAt) / 1000;
		const nextTime = this.anchorTime + elapsed;
		return this._duration > 0 ? Math.min(nextTime, this._duration) : nextTime;
	}

	private notifyTimeListeners() {
		const t = this._currentTime;
		this.timeListeners.forEach((fn) => {
			fn(t);
		});
	}

	play(
		url: string,
		onEnd: () => void,
		onPlay: (duration: number) => void,
		onProgress?: (currentTime: number) => void,
		onError?: () => void,
		fallbackDuration = 0,
	) {
		this.ensureEventListener();
		this.stopProgressLoop();
		this.fallbackDuration = Number.isFinite(fallbackDuration)
			? Math.max(0, fallbackDuration)
			: 0;

		const requestId = ++this.playRequestId;
		this.endedRequestId = null;
		this.onEndCallback = onEnd;
		this.onProgressCallback = onProgress || null;
		this.onErrorCallback = onError || null;
		this._isReady = false;
		this._isPlaying = false;
		this._duration = this.fallbackDuration;
		this._currentTime = 0;
		this.anchorTime = 0;
		this.anchorUpdatedAt = performance.now();

		invoke<AudioSnapshot>("player_load", {
			source: url,
			autoplay: true,
			requestId,
		})
			.then((snapshot) => {
				if (requestId !== this.playRequestId) return;
				if (!this.applySnapshot(snapshot)) return;
				onPlay(this._duration);
			})
			.catch((error) => {
				if (requestId !== this.playRequestId) return;
				console.error("[CorePlayer] native load error:", error);
				this.onErrorCallback?.();
			});
	}

	private startProgressLoop() {
		if (this.rafId !== null) return;

		let lastStoreUpdate = 0;
		const STORE_UPDATE_INTERVAL = 200;

		const loop = () => {
			this._currentTime = this.getInterpolatedTime();
			this.notifyTimeListeners();

			if (this.onProgressCallback) {
				const now = performance.now();
				if (now - lastStoreUpdate > STORE_UPDATE_INTERVAL) {
					this.onProgressCallback(this._currentTime);
					lastStoreUpdate = now;
				}
			}

			if (this._isPlaying) {
				this.rafId = requestAnimationFrame(loop);
			} else {
				this.rafId = null;
			}
		};

		this.rafId = requestAnimationFrame(loop);
	}

	private stopProgressLoop() {
		if (this.rafId !== null) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
	}

	pause() {
		this._isPlaying = false;
		this.anchorTime = this._currentTime;
		this.anchorUpdatedAt = performance.now();
		this.stopProgressLoop();
		invoke<AudioSnapshot>("player_pause")
			.then((snapshot) => this.applySnapshot(snapshot))
			.catch((error) => {
				console.error("[CorePlayer] native pause error:", error);
			});
	}

	resume() {
		this._isPlaying = true;
		this.anchorUpdatedAt = performance.now();
		this.startProgressLoop();
		invoke<AudioSnapshot>("player_play")
			.then((snapshot) => this.applySnapshot(snapshot))
			.catch((error) => {
				console.error("[CorePlayer] native play error:", error);
			});
	}

	seek(per: number) {
		if (!this._isReady) return;

		const clamped = Math.max(0, Math.min(1, per));
		const time = this._duration * clamped;
		this.anchorTime = time;
		this.anchorUpdatedAt = performance.now();
		this._currentTime = time;
		this.notifyTimeListeners();

		invoke<AudioSnapshot>("player_seek", { positionSecs: time })
			.then((snapshot) => this.applySnapshot(snapshot))
			.catch((error) => {
				console.error("[CorePlayer] native seek error:", error);
			});
	}

	setVolume(val: number) {
		invoke<AudioSnapshot>("player_set_volume", { volume: val })
			.then((snapshot) => this.applySnapshot(snapshot))
			.catch((error) => {
				console.error("[CorePlayer] native volume error:", error);
			});
	}

	preload(url: string) {
		const requestId = this.playRequestId;
		invoke<PreloadResult>("player_preload", {
			source: url,
			requestId,
		}).catch((error) => {
			if (requestId !== this.playRequestId) return;
			console.warn("[CorePlayer] native preload skipped:", error);
		});
	}

	listOutputDevices() {
		return invoke<AudioDeviceInfo[]>("list_audio_output_devices");
	}

	setOutputDevice(deviceId: string | null) {
		return invoke<AudioSnapshot>("player_set_output_device", {
			deviceId,
		}).then((snapshot) => {
			this.applySnapshot(snapshot);
			return snapshot;
		});
	}

	setReplayGain(enabled: boolean, preampDb = 0) {
		return invoke<AudioSnapshot>("player_set_replay_gain", {
			enabled,
			preampDb,
		}).then((snapshot) => {
			this.applySnapshot(snapshot);
			return snapshot;
		});
	}

	getReplayGainState() {
		return {
			gainDb: this.replayGainDb,
			applied: this.replayGainApplied,
			preampDb: this.replayGainPreampDb,
		};
	}

	setEqualizer(enabled: boolean, gainsDb: number[]) {
		return invoke<AudioSnapshot>("player_set_equalizer", {
			enabled,
			gainsDb,
		}).then((snapshot) => {
			this.applySnapshot(snapshot);
			return snapshot;
		});
	}

	getEqualizerState() {
		return {
			enabled: this.equalizerEnabled,
			gainsDb: [...this.equalizerGainsDb],
		};
	}

	setCrossfade(durationSecs: number) {
		return invoke<AudioSnapshot>("player_set_crossfade", {
			durationSecs,
		}).then((snapshot) => {
			this.applySnapshot(snapshot);
			return snapshot;
		});
	}

	getCrossfadeDuration() {
		return this.crossfadeDuration;
	}

	getPosition() {
		this._currentTime = this.getInterpolatedTime();
		return this._currentTime;
	}

	isReady() {
		return this._isReady;
	}

	getReactVolume(): number {
		const target = this._isPlaying ? this.nativeAudioLevel : 0;
		const factor = target > this.smoothVolume ? 0.5 : 0.08;
		this.smoothVolume += (target - this.smoothVolume) * factor;
		return this.smoothVolume;
	}

	getSpectrum(): number[] {
		return this._isPlaying ? [...this.nativeSpectrum] : [];
	}
}

export const corePlayer = new CorePlayer();
