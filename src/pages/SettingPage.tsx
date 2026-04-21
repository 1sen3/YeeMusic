import {
  useSettingStore,
  type AppearanceSettings,
} from "@/lib/store/settingStore";
import SettingsExpandar, {
  SettingsExpandarDetail,
} from "@/components/settings/SettingsExpandar";
import { Button } from "@/components/ui/button";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { QUALITY_BY_KEY, QUALITY_LIST } from "@/lib/constants/song";
import {
  ArrowDownload20Regular,
  CheckmarkCircle24Filled,
  CheckmarkStarburst20Regular,
  ChevronDown24Regular,
  Color20Regular,
  Info20Regular,
  Speaker220Regular,
  TextFont20Regular,
  Water20Regular,
  Window20Regular,
} from "@fluentui/react-icons";
import { IconBrandGithub } from "@tabler/icons-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Update, check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { Input } from "@/components/ui/input";
import { useDownloadStore } from "@/lib/store/downloadStore";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Popover, PopoverItem } from "@/components/yee-popover";

export default function SettingPage() {
  return (
    <div className="w-full h-full px-8 py-8 flex flex-col gap-8">
      <div className="w-full h-full flex flex-col gap-4">
        <h2 className="text-sm font-bold">音频与下载</h2>

        <div className="flex flex-col gap-2">
          <AudioSettingCard />
          <DownloadSettingCard />
        </div>
      </div>

      <div className="w-full h-full flex flex-col gap-4">
        <h2 className="text-sm font-bold">个性化</h2>

        <div className="flex flex-col gap-2">
          <AppearanceSettingCard />
          <MeshGradientSettingCard />
          <FontSettingCard />
        </div>
      </div>

      <div className="w-full h-full flex flex-col gap-4">
        <h2 className="text-sm font-bold">关于</h2>
        <div className="flex flex-col gap-2">
          <SettingsExpandar
            title="Yee Music"
            subtitle="更好用的网易云音乐客户端"
            icon={
              <img
                src={"/icons/logo.png"}
                className="object-cover"
                alt="Yee Music"
              />
            }
          >
            <div className="flex flex-col gap-0">
              <SettingsExpandarDetail desc="作者：isen" />
              <SettingsExpandarDetail
                desc="问题反馈"
                trailing={
                  <IconBrandGithub
                    className="size-4 hover:text-muted-foreground text-foreground cursor-pointer"
                    onClick={async () =>
                      await openUrl("https://github.com/1sen3/YeeMusicTauri")
                    }
                  />
                }
              />
            </div>
          </SettingsExpandar>
          <UpdateSettingCard />
        </div>
      </div>
    </div>
  );
}

function AudioSettingCard() {
  const preferQuality = useSettingStore((s) => s.audio.preferQuality);
  const setPreferQuality = useSettingStore((s) => s.setPreferQuality);

  return (
    <div className="flex flex-col gap-1">
      <SettingsExpandar
        title="音频质量"
        subtitle="选择优先播放的音质"
        icon={<Speaker220Regular />}
        trailing={
          <Popover
            trigger={
              <Button className="cursor-pointer bg-card text-foreground border-border hover:bg-foreground/2 rounded-sm border-b-2 shrink-0">
                <span>{QUALITY_BY_KEY[preferQuality].desc}</span>
                <ChevronDown24Regular />
              </Button>
            }
            className="-left-2"
          >
            {QUALITY_LIST.filter((q) => q.desc !== "UNLOCK").map((q) => (
              <PopoverItem
                key={q.key}
                isActive={preferQuality === q.key}
                onClick={() => setPreferQuality(q.key)}
              >
                {q.desc}
              </PopoverItem>
            ))}
          </Popover>
        }
      ></SettingsExpandar>
    </div>
  );
}

function DownloadSettingCard() {
  const downloadDir = useDownloadStore((s) => s.downloadDir);
  const setDownloadDir = useDownloadStore((s) => s.setDownloadDir);
  const loadFromStore = useDownloadStore((s) => s.loadFromStore);

  useEffect(() => {
    loadFromStore();
  }, []);

  async function handleChangeDir() {
    try {
      const selected = await open({
        directory: true,
        title: "选择下载目录",
      });
      if (!selected) return;
      await invoke("ensure_dir_exists", { path: selected });
      await setDownloadDir(selected as string);
    } catch (e) {
      console.error("更改下载目录失败:", e);
      toast.error(`更改目录失败：${e}`);
    }
  }

  return (
    <SettingsExpandar
      title="下载"
      subtitle="选择歌曲下载的目录"
      icon={<ArrowDownload20Regular />}
    >
      <div className="flex flex-col gap-0">
        <SettingsExpandarDetail>
          <div className="w-full flex justify-between items-center">
            <span className="text-sm text-muted-foreground truncate max-w-xs">
              {downloadDir || "加载中..."}
            </span>
            <Button
              className="cursor-pointer bg-card text-foreground border-border hover:bg-foreground/2 rounded-sm border-b-2 shrink-0"
              onClick={handleChangeDir}
            >
              更改目录
            </Button>
          </div>
        </SettingsExpandarDetail>
      </div>
    </SettingsExpandar>
  );
}

function AppearanceSettingCard() {
  const theme = useSettingStore((s) => s.appearance.theme);
  const setTheme = useSettingStore((s) => s.setTheme);
  const material = useSettingStore((s) => s.appearance.material);
  const setMaterial = useSettingStore((s) => s.setMaterial);

  const themeStr =
    theme === "system" ? "跟随系统" : theme === "light" ? "浅色" : "深色";

  return (
    <div className="flex flex-col gap-2">
      <SettingsExpandar
        title="主题"
        subtitle="选择 Yee Music 的显示主题"
        icon={<Color20Regular />}
        trailing={
          <span className="text-muted-foreground text-sm">{themeStr}</span>
        }
      >
        <div className="flex flex-col gap-0">
          <SettingsExpandarDetail>
            <div className="w-full flex flex-col items-start">
              <RadioGroup
                defaultValue={theme}
                onValueChange={(val) =>
                  setTheme(val as AppearanceSettings["theme"])
                }
              >
                <div className="flex gap-2 items-center">
                  <RadioGroupItem value="light" />
                  <span>浅色</span>
                </div>
                <div className="flex gap-2 items-center">
                  <RadioGroupItem value="dark" />
                  <span>深色</span>
                </div>
                <div className="flex gap-2 items-center">
                  <RadioGroupItem value="system" />
                  <span>跟随系统</span>
                </div>
              </RadioGroup>
            </div>
          </SettingsExpandarDetail>
        </div>
      </SettingsExpandar>

      <SettingsExpandar
        title="材质"
        subtitle="选择 Yee Music 的窗口材质"
        icon={<Window20Regular />}
        trailing={
          <div className="flex justify-end">
            <Popover
              trigger={
                <Button className="cursor-pointer bg-card text-foreground border-border hover:bg-foreground/2 rounded-sm border-b-2 shrink-0">
                  <span>{material}</span>
                  <ChevronDown24Regular />
                </Button>
              }
            >
              <PopoverItem
                key="acrylic"
                isActive={material === "acrylic"}
                onClick={() => setMaterial("acrylic")}
              >
                acrylic
              </PopoverItem>
              <PopoverItem
                key="mica"
                isActive={material === "mica"}
                onClick={() => setMaterial("mica")}
              >
                mica
              </PopoverItem>
              <PopoverItem
                key="none"
                isActive={material === "none"}
                onClick={() => setMaterial("none")}
              >
                none
              </PopoverItem>
            </Popover>
          </div>
        }
      ></SettingsExpandar>
    </div>
  );
}

function MeshGradientSettingCard() {
  const updateMeshGradient = useSettingStore((s) => s.updateMeshGradient);
  const meshGradientProps = useSettingStore((s) => s.appearance.meshGradient);

  const [distortion, setDistortion] = useState(meshGradientProps.distortion);
  const [swirl, setSwirl] = useState(meshGradientProps.swirl);
  const [grainMixer, setGrainMixer] = useState(meshGradientProps.grainMixer);
  const [grainOverlay, setGrainOverlay] = useState(
    meshGradientProps.grainOverlay,
  );
  const [speed, setSpeed] = useState(meshGradientProps.speed);

  useEffect(() => {
    setDistortion(meshGradientProps.distortion);
  }, [meshGradientProps.distortion]);

  useEffect(() => {
    setSwirl(meshGradientProps.swirl);
  }, [meshGradientProps.swirl]);

  useEffect(() => {
    setGrainMixer(meshGradientProps.grainMixer);
  }, [meshGradientProps.grainMixer]);

  useEffect(() => {
    setGrainOverlay(meshGradientProps.grainOverlay);
  }, [meshGradientProps.grainOverlay]);

  useEffect(() => {
    setSpeed(meshGradientProps.speed);
  }, [meshGradientProps.speed]);

  return (
    <SettingsExpandar
      icon={<Water20Regular />}
      title="流体渐变"
      subtitle="配置流体渐变效果"
    >
      <div className="flex flex-col gap-0">
        <SettingsExpandarDetail desc="变形强度">
          <Input
            type="number"
            className="w-20 bg-card"
            value={distortion}
            min={0}
            max={1}
            step={0.01}
            onChange={(e) => setDistortion(Number(e.target.value))}
            onBlur={() => {
              let val = distortion;
              if (isNaN(val)) val = 0;
              val = Math.min(Math.max(val, 0), 1);
              setDistortion(val);
              updateMeshGradient({ distortion: val });
            }}
          />
        </SettingsExpandarDetail>
        <SettingsExpandarDetail desc="漩涡强度">
          <Input
            type="number"
            className="w-20 bg-card"
            value={swirl}
            min={0}
            max={1}
            step={0.01}
            onChange={(e) => setSwirl(Number(e.target.value))}
            onBlur={() => {
              let val = swirl;
              if (isNaN(val)) val = 0;
              val = Math.min(Math.max(val, 0), 1);
              setSwirl(val);
              updateMeshGradient({ swirl: val });
            }}
          />
        </SettingsExpandarDetail>
        <SettingsExpandarDetail desc="颗粒混合">
          <Input
            type="number"
            className="w-20 bg-card"
            value={grainMixer}
            min={0}
            max={1}
            step={0.01}
            onChange={(e) => setGrainMixer(Number(e.target.value))}
            onBlur={() => {
              let val = grainMixer;
              if (isNaN(val)) val = 0;
              val = Math.min(Math.max(val, 0), 1);
              setGrainMixer(val);
              updateMeshGradient({ grainMixer: val });
            }}
          />
        </SettingsExpandarDetail>
        <SettingsExpandarDetail desc="颗粒叠加">
          <Input
            type="number"
            className="w-20 bg-card"
            value={grainOverlay}
            min={0}
            max={1}
            step={0.01}
            onChange={(e) => setGrainOverlay(Number(e.target.value))}
            onBlur={() => {
              let val = grainOverlay;
              if (isNaN(val)) val = 0;
              val = Math.min(Math.max(val, 0), 1);
              setGrainOverlay(val);
              updateMeshGradient({ grainOverlay: val });
            }}
          />
        </SettingsExpandarDetail>
        <SettingsExpandarDetail desc="速度">
          <Input
            type="number"
            className="w-20 bg-card"
            value={speed}
            min={0}
            max={1}
            step={0.01}
            onChange={(e) => setSpeed(Number(e.target.value))}
            onBlur={() => {
              let val = speed;
              if (isNaN(val)) val = 0;
              val = Math.min(Math.max(val, 0), 1);
              setSpeed(val);
              updateMeshGradient({ speed: val });
            }}
          />
        </SettingsExpandarDetail>
      </div>
    </SettingsExpandar>
  );
}

function FontSettingCard() {
  const fontSettings = useSettingStore((s) => s.appearance.font);
  const updateFont = useSettingStore((s) => s.updateFont);

  const [interfaceFont, setInterfaceFont] = useState(
    fontSettings.interfaceFontStr,
  );
  const [lyricFont, setLyricFont] = useState(fontSettings.lyricFontStr);

  useEffect(() => {
    setInterfaceFont(fontSettings.interfaceFontStr);
  }, [fontSettings.interfaceFontStr]);

  useEffect(() => {
    setLyricFont(fontSettings.lyricFontStr);
  }, [fontSettings.lyricFontStr]);

  return (
    <SettingsExpandar
      icon={<TextFont20Regular />}
      title="字体"
      subtitle="配置 Yee Music 的字体"
    >
      <SettingsExpandarDetail desc="界面字体">
        <Input
          className="w-60 bg-card"
          value={interfaceFont}
          placeholder={"例如：'PingFang UI', 'Google Sans'"}
          onChange={(e) => setInterfaceFont(e.target.value)}
          onBlur={() => updateFont({ interfaceFontStr: interfaceFont })}
        />
      </SettingsExpandarDetail>
      <SettingsExpandarDetail desc="歌词字体">
        <Input
          className="w-60 bg-card"
          value={lyricFont}
          placeholder={"例如：'PingFang UI', 'Google Sans'"}
          onChange={(e) => setLyricFont(e.target.value)}
          onBlur={() => updateFont({ lyricFontStr: lyricFont })}
        />
      </SettingsExpandarDetail>
    </SettingsExpandar>
  );
}

function UpdateSettingCard() {
  const [version, setVersion] = useState("");
  const [checking, setChecking] = useState(false);
  const [isNewest, setIsNewest] = useState<boolean | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateObj, setUpdateObj] = useState<Update | null>(null);
  const [progress, setProgress] = useState<{
    downloaded: number;
    contentLength: number;
  } | null>(null);

  async function checkForUpdates() {
    const update = await check();
    if (update) {
      console.log(`found update ${update.version}`);
      setUpdateObj(update);
      setIsNewest(false);
      toast.success(`发现新版本 v${update.version}！`, { duration: 3000 });
    } else {
      setUpdateObj(null);
      setIsNewest(true);
    }
  }

  async function handleUpdate() {
    if (!updateObj) return;

    setIsUpdating(true);

    let downloaded = 0;
    let contentLength = 0;

    try {
      await updateObj.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength || 0;
            console.log(`started downloading ${contentLength} bytes`);
            setProgress({ downloaded, contentLength });
            break;
          case "Progress":
            downloaded += event.data.chunkLength || 0;
            console.log(`downloaded ${downloaded} from ${contentLength}`);
            setProgress({ downloaded, contentLength });
            break;
          case "Finished":
            console.log("download finished");
            break;
        }
      });

      console.log("update installed");
      toast.success("更新下载完成，即将重启并挂载更新...", { duration: 3000 });
      setTimeout(async () => {
        await relaunch();
      }, 3000);
    } catch (e) {
      console.log(`failed to install update: ${e}`);
      toast.error("更新失败，请稍后重试...");
    } finally {
      setIsUpdating(false);
      setProgress(null);
    }
  }

  async function handleCheck() {
    setChecking(true);
    setIsNewest(null);
    try {
      await checkForUpdates();
    } catch (e) {
      console.log(`failed to check update: ${e}`);
      toast.error("检查更新失败，请重试...");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    async function loadVersion() {
      const v = await getVersion();
      setVersion(v);
    }

    loadVersion();
  }, []);

  return (
    <div className="flex flex-col gap-0">
      <SettingsExpandar
        className={cn(isNewest !== null && "rounded-b-none")}
        title={`Beta ${version}`}
        icon={<CheckmarkStarburst20Regular />}
        trailing={
          <div className="flex justify-end">
            <Button
              className={cn(
                "bg-card text-foreground border-border hover:bg-foreground/2 rounded-sm border-b-2",
                checking && "bg-muted",
              )}
              onClick={handleCheck}
              disabled={checking || isUpdating}
            >
              <div className="flex gap-2 transition-[width] duration-300 ease-in-out">
                <Spinner
                  className={cn(
                    "transition-all duration-300 -mx-2.5",
                    checking
                      ? "opacity-100 scale-100 mx-0"
                      : "opacity-0 scale-75",
                  )}
                />
                <span>{checking ? "检查中..." : "检查更新"}</span>
              </div>
            </Button>
          </div>
        }
      ></SettingsExpandar>
      {isNewest === true && (
        <div className="bg-green-400/25 rounded-b-md border-t-0 border border-border p-4 flex items-center gap-2 text-sm">
          <CheckmarkCircle24Filled className="text-green-600" />
          已更新到最新版本
        </div>
      )}
      {isNewest === false && updateObj && (
        <div className="bg-card/60 rounded-b-md border-t-0 border border-border p-4 flex flex-col gap-4 text-sm">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-4">
              <Info20Regular className="text-foreground" />
              检测到新版本 v{updateObj.version}，是否立即更新？
            </div>

            <div className="flex items-center gap-4">
              <Button
                className={cn(
                  "bg-card text-foreground border-border hover:bg-foreground/2 rounded-sm border-b-2",
                )}
                onClick={handleUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <div className="flex items-center gap-2">
                    <Spinner />
                    <span>
                      {progress && progress.contentLength > 0
                        ? `正在下载 (${((progress.downloaded / progress.contentLength) * 100).toFixed(0)}%)`
                        : "正在更新..."}
                    </span>
                  </div>
                ) : (
                  "立即更新"
                )}
              </Button>
            </div>
          </div>
          {isUpdating && progress && progress.contentLength > 0 && (
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{
                  width: `${(progress.downloaded / progress.contentLength) * 100}%`,
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
