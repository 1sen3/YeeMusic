import { Howl } from "howler";

type TimeListener = (currentTime: number) => void;

/**
 * 高频时间广播：每帧更新内部 currentTime，
 * 通过 subscribeTime() 让组件按需订阅，
 * 仅以低频（~4fps）回调 Zustand store 的 onProgress。
 */
class CorePlayer {
	private howl: Howl | null = null;
	private rafId: number | null = null;
	private onProgressCallback: ((currentTime: number) => void) | null = null;
	private onErrorCallback: (() => void) | null = null;

	private analyser: AnalyserNode | null = null;
	private dataArray: Uint8Array | null = null;
	private smoothVolume: number = 0;
	private isAnalyserInitialized = false;

	// ── 高频时间广播 ──
	private _currentTime: number = 0;
	private _duration: number = 0;
	private timeListeners: Set<TimeListener> = new Set();

	/** 当前播放时间（秒），每帧更新，直接读取无开销 */
	getCurrentTime(): number {
		return this._currentTime;
	}

	/** 当前进度百分比 0-100 */
	getProgress(): number {
		return this._duration > 0 ? (this._currentTime / this._duration) * 100 : 0;
	}

	/**
	 * 订阅高频时间更新（每 rAF 帧触发）
	 * 返回取消订阅函数
	 */
	subscribeTime(listener: TimeListener): () => void {
		this.timeListeners.add(listener);
		return () => {
			this.timeListeners.delete(listener);
		};
	}

	private notifyTimeListeners() {
		const t = this._currentTime;
		this.timeListeners.forEach((fn) => fn(t));
	}

	private initAnalyser() {
		if (this.isAnalyserInitialized || !Howler.ctx) return;
		try {
			this.analyser = Howler.ctx.createAnalyser();
			this.analyser.fftSize = 256;
			Howler.masterGain.connect(this.analyser);
			this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
			this.isAnalyserInitialized = true;
		} catch (e) {
			console.error("[CorePlayer] Web Audio API 分析器初始化失败:", e);
		}
	}

	// 播放歌曲
	play(
		url: string,
		onEnd: () => void,
		onPlay: (duration: number) => void,
		onProgress?: (currentTime: number) => void,
		onError?: () => void,
	) {
		if (this.howl) {
			this.howl.stop();
			this.howl.unload();
		}
		this.stopProgressLoop();

		this.onProgressCallback = onProgress || null;
		this.onErrorCallback = onError || null;
		this._currentTime = 0;

		this.howl = new Howl({
			src: [url],
			html5: true,
			format: ["mp3", "flac"],
			onplay: () => {
				this.initAnalyser();
				this._duration = this.howl?.duration() || 0;

				onPlay(this._duration);
				this.startProgressLoop();
			},
			onpause: () => this.stopProgressLoop(),
			onend: () => {
				this.stopProgressLoop();
				onEnd();
			},
			onloaderror: (_, error) => {
				console.error("[CorePlayer] load error:", error);
				if (this.onErrorCallback) this.onErrorCallback();
			},
			onplayerror: (_, error) => {
				console.error("[CorePlayer] play error:", error);
				if (this.onErrorCallback) this.onErrorCallback();
			},
		});

		this.howl?.play();
	}

	private startProgressLoop() {
		// Zustand store 更新节流：每 ~200ms 更新一次（~5fps），
		// 对进度条 UI 足够平滑
		let lastStoreUpdate = 0;
		const STORE_UPDATE_INTERVAL = 200;

		const loop = () => {
			if (this.howl) {
				this._currentTime = this.howl.seek() as number;

				// 高频广播：通知所有直接订阅者（歌词 MotionValue 等）
				this.notifyTimeListeners();

				// 低频回调：更新 Zustand store（进度条、时间显示等）
				if (this.onProgressCallback) {
					const now = performance.now();
					if (now - lastStoreUpdate > STORE_UPDATE_INTERVAL) {
						this.onProgressCallback(this._currentTime);
						lastStoreUpdate = now;
					}
				}
			}
			this.rafId = requestAnimationFrame(loop);
		};
		this.rafId = requestAnimationFrame(loop);
	}

	private stopProgressLoop() {
		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = null;
		}
	}

	pause() {
		this.howl?.pause();
	}

	resume() {
		this.howl?.play();
	}

	seek(per: number) {
		if (!this.howl) return;

		const time = this.howl.duration() * per;
		this.howl.seek(time);
		// seek 后立即更新内部时间
		this._currentTime = time;
	}

	setVolume(val: number) {
		this.howl?.volume(val);
	}

	getPosition() {
		return this._currentTime;
	}

	isReady() {
		return this.howl !== null;
	}

	getReactVolume(): number {
		if (
			!this.analyser ||
			!this.dataArray ||
			!this.howl ||
			!this.howl.playing()
		) {
			this.smoothVolume += (0 - this.smoothVolume) * 0.08;
			return this.smoothVolume;
		}

		this.analyser.getByteFrequencyData(
			this.dataArray as Uint8Array<ArrayBuffer>,
		);

		const noiseFloor = 30;
		const binCount = Math.min(50, this.dataArray.length);
		let sum = 0;
		for (let i = 0; i < binCount; ++i) {
			const v = this.dataArray[i];
			sum += v > noiseFloor ? v - noiseFloor : 0;
		}
		const avg = sum / binCount;
		const rawVolume = avg / (255 - noiseFloor);

		const factor = rawVolume > this.smoothVolume ? 0.5 : 0.1;
		this.smoothVolume += (rawVolume - this.smoothVolume) * factor;

		return this.smoothVolume;
	}
}

export const corePlayer = new CorePlayer();
