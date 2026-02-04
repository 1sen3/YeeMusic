import { Howl } from "howler";

class CorePlayer {
  private howl: Howl | null = null;
  private rafId: number | null = null;
  private onProgressCallback: ((currentTime: number) => void) | null = null;

  // 播放歌曲
  play(
    url: string,
    onEnd: () => void,
    onPlay: (duration: number) => void,
    onProgress?: (currentTime: number) => void,
  ) {
    if (this.howl) this.howl.unload();
    this.stopProgressLoop();

    this.onProgressCallback = onProgress || null;

    this.howl = new Howl({
      src: [url],
      html5: true,
      format: ["mp3", "flac"],
      onplay: () => {
        onPlay(this.howl?.duration() || 0);
        this.startProgressLoop();
      },
      onpause: () => this.stopProgressLoop(),
      onend: () => {
        this.stopProgressLoop();
        onEnd();
      },
    });

    this.howl?.play();
  }

  private startProgressLoop() {
    const loop = () => {
      if (this.howl && this.onProgressCallback) {
        this.onProgressCallback(this.howl.seek() as number);
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
  }

  setVolume(val: number) {
    this.howl?.volume(val);
  }

  getPosition() {
    return this.howl?.seek() || 0;
  }
}

export const corePlayer = new CorePlayer();
