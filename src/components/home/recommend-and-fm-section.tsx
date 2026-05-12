import { getDailyRecommend } from "@/lib/services/recommend";
import { Song } from "@/lib/types";
import { Vibrant } from "node-vibrant/browser";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import SFIcon from "@bradleyhodges/sfsymbols-react";
import {
  sfHeartSlashFill,
  sfForwardEndFill,
  sfPlayFill,
  sfPauseFill,
  sfAntennaRadiowavesLeftAndRight,
  sfCalendar,
} from "@bradleyhodges/sfsymbols";
import { YeeButton } from "../yee-button";
import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";

export function RecommendAndFMSection() {
  return (
    <div className="w-full h-48 flex gap-8">
      <RecommendCard />
      <FmCard />
    </div>
  );
}

const colorCache: Record<string, { vibrant: string; lightVibrant: string }> =
  {};

function RecommendCard() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [coverUrl, setCoverUrl] = useState("");
  const [vibrant, setVibrant] = useState("");
  const [lightVibrant, setLightVibrant] = useState("");
  const navigate = useNavigate();

  const playQueue = usePlayerStore((s) => s.playQueue);

  useEffect(() => {
    async function fetchData() {
      const res = await getDailyRecommend();
      const url = res[0]?.al?.picUrl || "";

      setSongs(res);
      setCoverUrl(url);

      if (url) {
        if (colorCache[url]) {
          setVibrant(colorCache[url].vibrant);
          setLightVibrant(colorCache[url].lightVibrant);
          return;
        }

        const v = new Vibrant(url, {
          quality: 1,
          colorCount: 64,
        });

        try {
          const palette = await v.getPalette();
          const vibrant = palette.DarkVibrant?.hex || "";
          const lightVibrant = palette.Vibrant?.hex || "";

          colorCache[url] = { vibrant, lightVibrant };
          setVibrant(vibrant);
          setLightVibrant(lightVibrant);
        } catch (err) {
          console.error("提取颜色失败", err);
        }
      }
    }
    fetchData();
  }, []);

  const date = new Date();
  const day = date.getDate();
  const month = date.getMonth() + 1;

  return (
    <div
      className="w-full h-full bg-(--dynamic-color) rounded-lg overflow-hidden relative text-white drop-shadow-[0_10px_8px_rgba(0,0,0,0.1)] cursor-pointer"
      style={
        {
          "--dynamic-color": vibrant || "gray",
          "--light-vibrant": lightVibrant || "white",
        } as React.CSSProperties
      }
      onClick={() => {
        navigate("/recommend/daily");
      }}
    >
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        {coverUrl && (
          <img
            src={coverUrl}
            className="w-full h-full object-cover brightness-60"
            alt="Recommend cover"
          />
        )}
      </div>

      <div className="relative z-10 w-full h-full p-6 flex flex-col justify-between">
        <span className="text-md font-medium drop-shadow-lg flex items-center gap-2">
          <SFIcon icon={sfCalendar} className="size-4 text-white/80" />
          每日推荐
        </span>

        <div className="flex flex-col gap-2">
          <span className="text-white text-lg drop-shadow-md font-medium">
            {month} 月 {day} 日，从《{songs[0]?.name}》听起
          </span>
          <Button
            className="w-24 bg-(--dynamic-color) border-b-(--light-vibrant) border-b-2 drop-shadow-lg font-light cursor-pointer transition-all duration-300 hover:brightness-110 hover:shadow-xl text-white"
            onClick={() => playQueue(songs)}
          >
            立即播放
          </Button>
        </div>
      </div>
    </div>
  );
}

const fmColorCache: Record<string, string> = {};

function FmCard() {
  const {
    fmPlaylist,
    fetchFmSongs,
    playFm,
    isFmMode,
    isPlaying,
    togglePlay,
    nextFmSong,
  } = usePlayerStore();
  const [bgColor, setBgColor] = useState("#2f2f2f"); // 初始深灰色
  const trashFmSong = usePlayerStore((s) => s.trashFmSong);

  const currentFmSong = fmPlaylist[0];

  useEffect(() => {
    if (fmPlaylist.length === 0) {
      fetchFmSongs();
    }
  }, []);
  useEffect(() => {
    const url = currentFmSong?.al?.picUrl;
    if (url) {
      if (fmColorCache[url]) {
        setBgColor(fmColorCache[url]);
        return;
      }

      const v = new Vibrant(url);
      v.getPalette().then((palette) => {
        const color = palette.DarkVibrant?.hex || palette.DarkMuted?.hex;
        if (color) {
          fmColorCache[url] = color;
          setBgColor(color);
        }
      });
    }
  }, [currentFmSong]);

  const isPlayingFm = isFmMode && isPlaying;

  return (
    <div
      className="w-full h-full rounded-lg drop-shadow-[0_10px_8px_rgba(0,0,0,0.1)] relative text-white overflow-hidden shadow-inner transition-colors duration-1000"
      style={{
        background: `linear-gradient(135deg, ${bgColor} 0%, color-mix(in srgb, ${bgColor}, black 20%) 100%)`,
      }}
    >
      <div className="absolute inset-0 bg-black/10 z-0 pointer-events-none" />

      <div className="w-full h-full flex justify-between p-6 relative z-10">
        <div className="flex flex-col justify-between">
          <span className="text-md font-medium drop-shadow-lg flex items-center gap-2">
            <SFIcon
              icon={sfAntennaRadiowavesLeftAndRight}
              className="size-4 text-white/80"
            />
            私人漫游
          </span>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <span className="text-lg font-semibold line-clamp-1 max-w-58">
                {currentFmSong?.name}
              </span>
              <span className="text-md opacity-70 line-clamp-1 max-w-58 font-light tracking-wide">
                {currentFmSong?.ar?.map((ar) => ar.name).join(" / ")}
              </span>
            </div>

            <div className="flex gap-4 items-center">
              <YeeButton
                variant="ghost"
                className="hover:bg-transparent! hover:text-white text-white/80"
                icon={<SFIcon icon={sfHeartSlashFill} className="size-6" />}
                onClick={() => {
                  if (!currentFmSong) return;
                  trashFmSong();
                }}
              />
              <YeeButton
                variant="ghost"
                className="hover:bg-transparent! hover:text-white text-white/80"
                icon={
                  <SFIcon
                    icon={isPlayingFm ? sfPauseFill : sfPlayFill}
                    className="size-5"
                  />
                }
                onClick={() => {
                  if (isFmMode) {
                    togglePlay();
                  } else {
                    playFm();
                  }
                }}
              />
              <YeeButton
                variant="ghost"
                className="hover:bg-transparent! hover:text-white text-white/80"
                icon={<SFIcon icon={sfForwardEndFill} className="size-5" />}
                onClick={() => {
                  nextFmSong();
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center">
          {currentFmSong?.al?.picUrl && (
            <img
              src={currentFmSong.al.picUrl}
              className="h-full rounded-[8px] object-cover drop-shadow-2xl"
            />
          )}
        </div>
      </div>
    </div>
  );
}
