import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { creative } from "@/lib/types";
import {
  ArrowDownload24Regular,
  Badge24Regular,
  Heart24Regular,
  MoreHorizontal24Regular,
  Play24Filled,
  Play24Regular,
} from "@fluentui/react-icons";
import Image from "next/image";

export function VoicePreview({ creatives }: { creatives: creative[] }) {
  return (
    <div className="flex flex-col gap-6 w-1/2">
      {creatives.map((creative) => (
        <VoicePreviewItem creative={creative} key={creative.creativeId} />
      ))}
    </div>
  );
}

export function VoicePreviewItem({ creative }: { creative: creative }) {
  const uiElement = creative?.uiElement;
  const title =
    uiElement?.mainTitle?.title || uiElement?.subTitle?.title || "默认标题";
  const cover = uiElement?.image?.imageUrl || "";
  const labels = uiElement?.labelTexts;
  const playCount = creative?.creativeExtInfoVO?.playCount;

  if (!creative) {
    return (
      <div className="bg-white flex gap-4 justify-between">
        <div className="w-16 h-16 rounded-sm overflow-hidden">
          <Skeleton className="w-full h-full" />
        </div>

        <div className="flex-1 flex flex-col gap-2 justify-center">
          <Skeleton className="w-1/2 h-4" />
          <Skeleton className="w-1/4 h-4" />
        </div>
      </div>
    );
  }

  // 格式化播放次数
  const formatPlayCount = (count?: number) => {
    if (!count) return "";
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万`;
    }
    return count.toString();
  };

  return (
    <div className="bg-white flex gap-4 justify-between group">
      <div className="w-16 h-16 rounded-sm overflow-hidden relative shrink-0 border">
        <Image
          loading="lazy"
          src={cover}
          fill
          alt="Voice cover"
          className="object-cover group-hover:brightness-50 transform transition-all duration-300 ease-in-out cursor-pointer"
        />

        <div className="cursor-pointer opacity-0 group-hover:opacity-100 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white transform transition-all duration-300 ease-in-out">
          <Play24Filled width={24} height={24} />
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1 justify-center min-w-0">
        <p className="truncate">{title}</p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {labels?.[0] && (
            <Badge className=" bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
              {labels[0]}
            </Badge>
          )}
          {playCount && (
            <span className="flex items-center gap-2">
              <Play24Filled className="size-3" />
              {formatPlayCount(playCount)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 shrink-0 pr-6">
        <ArrowDownload24Regular className="size-5 text-gray-500 cursor-pointer hover:text-gray-700" />
        <MoreHorizontal24Regular className="size-5 text-gray-500 cursor-pointer hover:text-gray-700" />
      </div>
    </div>
  );
}
