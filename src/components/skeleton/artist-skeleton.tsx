import { Skeleton } from "../ui/skeleton";

export function ArtistSkeleton() {
	return (
		<div className="w-full h-full flex flex-col p-8 gap-8 overflow-hidden">
			<div className="flex gap-8 items-center">
				<Skeleton className="size-44 rounded-full" />
				<div className="flex flex-col gap-6">
					<Skeleton className="w-44 h-6" />
					<div className="flex flex-col gap-4">
						<Skeleton className="w-32 h-6" />
						<Skeleton className="w-32 h-6" />
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-4">
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i}>
						<Skeleton className="w-full h-12" />
					</div>
				))}
			</div>
		</div>
	);
}
