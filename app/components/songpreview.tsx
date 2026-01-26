import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownload24Regular,
  Heart24Regular,
  MoreHorizontal24Regular,
  Play24Filled,
  Play24Regular,
} from "@fluentui/react-icons";
import Image from "next/image";

export function SongPreview() {
  return (
    <div className="flex flex-col gap-6 w-1/2">
      <SongPreviewItem song="ss" />
      <SongPreviewItem song={null} />
      <SongPreviewItem song={null} />
    </div>
  );
}

export function SongPreviewItem({ song }: { song: string | null }) {
  if (!song) {
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

  return (
    <div className="bg-white flex gap-4 justify-between group">
      <div className="w-16 h-16 rounded-sm overflow-hidden shadow-md relative">
        <Image
          src="/album.jpg"
          width={64}
          height={64}
          alt="Album cover"
          className="group-hover:brightness-50 transform transition-all duration-300 ease-in-out cursor-pointer"
        />

        <div className="cursor-pointer opacity-0 group-hover:opacity-100 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white transform transition-all duration-300 ease-in-out">
          <Play24Filled width={24} height={24} />
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1 justify-center">
        <p>美妙生活</p>
        <p className="text-gray-500 text-sm">林宥嘉</p>
      </div>

      <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100">
        <ArrowDownload24Regular className="size-5 text-gray-500 cursor-pointer" />
        <Heart24Regular className="size-5 text-gray-500 cursor-pointer" />
        <MoreHorizontal24Regular className="size-5 text-gray-500 cursor-pointer" />
      </div>
    </div>
  );
}
