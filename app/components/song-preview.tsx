import { Skeleton } from "@/components/ui/skeleton";
import { Resource } from "@/lib/types";
import {
  ArrowDownload24Regular,
  Heart24Regular,
  MoreHorizontal24Regular,
  Play24Filled,
  Play24Regular,
} from "@fluentui/react-icons";
import Image from "next/image";

export function SongPreview({ resources }: { resources: Resource[] }) {
  return (
    <div className="flex flex-col gap-6 w-1/2">
      {resources.map((res) => (
        <SongPreviewItem resource={res} key={res.resourceId} />
      ))}
    </div>
  );
}

export function SongPreviewItem({ resource }: { resource: Resource }) {
  const uiElement = resource?.uiElement;
  const resourceExtInfo = resource?.resourceExtInfo;
  const title =
    uiElement?.mainTitle?.title || uiElement?.subTitle?.title || "默认标题";
  const artist =
    resourceExtInfo?.artists?.map((ar) => ar.name).join("、") || "";
  const cover = uiElement?.image?.imageUrl || "";

  if (!resource) {
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
    <div className="bg-white flex gap-4 justify-between group overflow-hidden">
      <div className="w-16 h-16 rounded-sm overflow-hidden relative">
        <Image
          src={cover}
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
        <p>{title}</p>
        <p className="w-2/3 text-gray-500 text-sm line-clamp-1">{artist}</p>
      </div>

      <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 pr-6 translate-x-20 group-hover:translate-x-0 transform transition-all duration-300 ease-in-out">
        <ArrowDownload24Regular className="size-5 text-gray-500 cursor-pointer hover:text-gray-700" />
        <Heart24Regular className="size-5 text-gray-500 cursor-pointer hover:text-gray-700" />
        <MoreHorizontal24Regular className="size-5 text-gray-500 cursor-pointer hover:text-gray-700" />
      </div>
    </div>
  );
}
