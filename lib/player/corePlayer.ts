import { Howl } from "howler";

class CorePlayer {
  private howl: Howl | null = null;

  // 播放歌曲
  play(url: string, onEnd: () => void, onPlay: (duration: number) => void) {
    if (this.howl) this.howl.unload();

    this.howl = new Howl({
      src: [url],
      html5: true,
      format: ["mp3", "flac"],
      onplay: () => onPlay(this.howl?.duration() || 0),
      onend: onEnd,
    });

    this.howl.play();
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
