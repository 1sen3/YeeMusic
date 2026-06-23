import { Skeleton } from "../ui/skeleton";

export function SearchSkeleton({ tabValue }: { tabValue: string }) {
	if (tabValue === "1") {
		return (
			<div className="flex flex-col gap-6">
				{Array.from({ length: 8 }).map(() => (
					<Skeleton className="w-full h-16" />
				))}
			</div>
		);
	}

	if (tabValue === "1000") {
		return (
			<div className="flex flex-col gap-4">
				{Array.from({ length: 6 }).map(() => (
					<div className="grid grid-cols-2">
						<div className="flex gap-4 items-center">
							<Skeleton className="w-32 h-32" />
							<div className="flex flex-col gap-4">
								<Skeleton className="w-32 h-6" />
								<Skeleton className="w-18 h-6" />
								<Skeleton className="size-8 rounded-full" />
							</div>
						</div>
						<div className="flex gap-4 items-center">
							<Skeleton className="w-32 h-32" />
							<div className="flex flex-col gap-4">
								<Skeleton className="w-32 h-6" />
								<Skeleton className="w-18 h-6" />
								<Skeleton className="size-8 rounded-full" />
							</div>
						</div>
					</div>
				))}
			</div>
		);
	}

	if (tabValue === "100") {
		return (
			<div className="grid grid-cols-6 gap-8">
				{Array.from({ length: 18 }).map(() => (
					<div className="flex flex-col gap-4 items-center">
						<Skeleton className="size-32 rounded-full" />
						<Skeleton className="w-24 h-6" />
					</div>
				))}
			</div>
		);
	}

	if (tabValue === "10") {
		return (
			<div className="grid grid-cols-6 gap-8">
				{Array.from({ length: 18 }).map(() => (
					<div className="flex flex-col gap-4 items-center">
						<Skeleton className="size-32 rounded-xl" />
						<Skeleton className="w-24 h-6" />
					</div>
				))}
			</div>
		);
	}
}
