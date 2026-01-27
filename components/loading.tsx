import { Spinner } from "./ui/spinner";

export function Loading() {
  return (
    <div className="w-full min-h-full px-8 py-8 flex items-center justify-center">
      <div className="flex gap-2">
        <Spinner className="size-6" />
        <span>加载中...</span>
      </div>
    </div>
  );
}
