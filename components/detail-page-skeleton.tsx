import { Loading } from "@/components/loading";

interface DetailPageSkeletonProps<T> {
  loading: boolean;
  data: T | null;
  children: (data: T) => React.ReactNode;
}

export function DetailPageSkeleton<T>({
  loading,
  data,
  children,
}: DetailPageSkeletonProps<T>) {
  return (
    <div className="w-full h-full px-8 py-8 flex flex-col">
      {loading && <Loading />}
      {!loading && !data && (
        <div className="w-full h-full flex justify-center items-center text-muted-foreground">
          未找到相关内容
        </div>
      )}
      {data && children(data)}
    </div>
  );
}
