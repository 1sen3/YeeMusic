// "use client";

// import { Button } from "./ui/button";
// import Image from "next/image";
// import { Badge } from "./ui/badge";
// import {
//   ArrowRepeat124Regular,
//   ArrowRepeatAllOff24Regular,
//   ArrowShuffle24Regular,
//   CommentQuote24Regular,
//   MoreHorizontal24Filled,
//   NavigationPlay20Regular,
//   Next24Filled,
//   Pause24Filled,
//   Play24Filled,
//   Previous24Filled,
//   SlideSize24Regular,
//   Speaker024Filled,
//   Speaker124Filled,
//   Speaker124Regular,
//   Speaker224Filled,
//   Speaker224Regular,
//   TextBulletList24Regular,
// } from "@fluentui/react-icons";
// import { MyTooltip } from "./my-tooltip";
// import { Slider } from "./ui/slider";
// import { SONG_QUALITY, SONG_QUALITY_STYLES } from "@/lib/constants/song";
// import { usePlayerStore } from "@/lib/store/playerStore";
// import { useEffect } from "react";
// import { cn, formatTime } from "@/lib/utils";
// import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
// import { REPEAT_MODE_CONFIG, SHUFFLE_CONFIG } from "@/lib/constants/player";
// import { Spinner } from "./ui/spinner";

// export function PlayerBar() {
//   const player = usePlayerStore();

//   const hasSongInList = player.currentSong !== null;
//   const isPlaying = player.isPlaying;
//   const PlayIcon = isPlaying ? Pause24Filled : Play24Filled;
//   const playTip = isPlaying ? "暂停" : "播放";

//   const repeatMode = player.repeatMode;
//   const isShuffle = player.isShuffle ? "on" : "off";

//   const repeatModeConfig = REPEAT_MODE_CONFIG[repeatMode];
//   const shuffleConfig = SHUFFLE_CONFIG[isShuffle];

//   const canShuffle = repeatModeConfig.canShuffle;

//   // 定期更新播放进度
//   useEffect(() => {
//     if (!player.isPlaying) return;

//     const interval = setInterval(() => {
//       player.updateProgress();
//     }, 100);

//     return () => clearInterval(interval);
//   }, [player.isPlaying, player]);

//   return (
//     <div
//       className={cn(
//         "translate-y-100 opacity-0 duration-300 ease-in-out absolute bottom-8 left-1/2 -translate-x-1/2 w-5/6 h-20 bg-background/90 backdrop-blur z-50 rounded-full",
//         hasSongInList ? "translate-y-0 opacity-100" : "",
//         "inset-shadow-xs inset-shadow-gray-700/10 shadow-md",
//       )}
//     >
//       <div className="flex items-center justify-between h-full px-8 gap-4">
//         <div className="flex items-center justify-start gap-1 shrink-0">
//           <MyTooltip tooltip={shuffleConfig.desc}>
//             <Button
//               variant="ghost"
//               size="icon"
//               className="size-12 cursor-pointer"
//               disabled={!canShuffle}
//               onClick={player.toggleShuffleMode}
//             >
//               <shuffleConfig.icon className="size-5" />
//             </Button>
//           </MyTooltip>
//           <MyTooltip tooltip="上一首">
//             <Button
//               variant="ghost"
//               size="icon"
//               className="size-12 cursor-pointer"
//               onClick={player.prev}
//             >
//               <Previous24Filled className="size-6" />
//             </Button>
//           </MyTooltip>
//           <MyTooltip tooltip={playTip}>
//             {player.isLoadingMusic ? (
//               <div className="w-12 h-12 flex items-center justify-center">
//                 <Spinner className="size-5" />
//               </div>
//             ) : (
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="size-12 cursor-pointer"
//                 onClick={() => player.togglePlay()}
//               >
//                 <PlayIcon className="size-6" />
//               </Button>
//             )}
//           </MyTooltip>
//           <MyTooltip tooltip="下一首">
//             <Button
//               variant="ghost"
//               size="icon"
//               className="size-12 cursor-pointer"
//               onClick={player.next}
//             >
//               <Next24Filled className="size-6" />
//             </Button>
//           </MyTooltip>
//           <MyTooltip tooltip={repeatModeConfig.desc}>
//             <Button
//               variant="ghost"
//               size="icon"
//               className="size-12 cursor-pointer"
//               onClick={player.toggleRepeatMode}
//             >
//               <repeatModeConfig.icon className="size-5" />
//             </Button>
//           </MyTooltip>
//         </div>

//         <div className="gap-4 min-w-0 flex items-center w-42">
//           <div className="shrink-0 relative group cursor-pointer ">
//             {hasSongInList && (
//               <Image
//                 src={player.currentSong?.al?.picUrl || ""}
//                 alt="Album cover"
//                 width={42}
//                 loading="eager"
//                 height={42}
//                 className="rounded-md group-hover:brightness-50 transform transition-all duration-300 ease-in-out"
//               />
//             )}
//             <SlideSize24Regular className="opacity-0 group-hover:opacity-100 size-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white  transform transition-all duration-300 ease-in-out" />
//           </div>
//           <div>
//             <p className="text-xs scale-2/3 line-clamp-1">
//               {player.currentSong?.name || ""}
//             </p>

//             <p className="text-xs scale-2/3 text-black/50 line-clamp-1">
//               {player.currentSong?.ar?.map((ar) => ar.name).join("、") || ""}
//             </p>
//           </div>
//         </div>

//         <div className="flex-1 w-full h-full flex items-center gap-4">
//           <span className="text-black/60">
//             {formatTime(player.currentTime)}
//           </span>
//           <Slider
//             value={[player.progress]}
//             onValueChange={(value) => player.seek(value[0])}
//             max={100}
//             step={0.1}
//             className=""
//           />
//           <span className="text-black/60">{formatTime(player.duration)}</span>
//         </div>

//         <div className="flex items-center justify-end gap-1 shrink-0">
//           <MyTooltip tooltip="歌词">
//             <Button
//               variant="ghost"
//               size="icon"
//               className="size-12  cursor-pointer"
//             >
//               <CommentQuote24Regular className="size-6" />
//             </Button>
//           </MyTooltip>
//           <MyTooltip tooltip="播放列表">
//             <Button
//               variant="ghost"
//               size="icon"
//               className="size-12 cursor-pointer"
//             >
//               <NavigationPlay20Regular className="size-6" />
//             </Button>
//           </MyTooltip>

//           <Popover>
//             <PopoverTrigger asChild>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="size-12 cursor-pointer"
//               >
//                 <Speaker224Regular className="size-6" />
//               </Button>
//             </PopoverTrigger>
//             <PopoverContent side="top" sideOffset={32} className="w-48">
//               <div className="flex gap-4 px-2">
//                 <Slider
//                   value={[player.volume]}
//                   onValueChange={(value) => player.updateVolume(value[0])}
//                   max={1}
//                   step={0.01}
//                   className="flex-1"
//                 />
//                 <span className="w-10 text-right">
//                   {Math.round(player.volume * 100)}%
//                 </span>
//               </div>
//             </PopoverContent>
//           </Popover>

//           <MyTooltip tooltip="更多">
//             <Button
//               variant="ghost"
//               size="icon"
//               className="size-12 cursor-pointer"
//             >
//               <MoreHorizontal24Filled className="size-6" />
//             </Button>
//           </MyTooltip>
//         </div>
//       </div>
//     </div>
//   );
// }
