import { Skeleton } from "../ui/skeleton";

export function HomeSkeleton() {
	return (
		<div className="w-full h-full flex flex-col p-8 gap-8 overflow-hidden">
			<div className="w-full h-48 grid grid-cols-2 gap-8">
				<Skeleton className="w-full h-48 rounded-xl" />
				<Skeleton className="w-full h-48 rounded-xl" />
			</div>

			<div className="flex flex-col gap-8">
				{Array.from({ length: 3 }).map((_, i) => (
					<div className="w-full flex flex-col gap-4" key={i}>
						<Skeleton className="w-44 h-8 rounded-md" />
						<div className="flex gap-4">
							{Array.from({ length: 7 }).map((_, j) => (
								<Skeleton className="w-36 h-36 rounded-md" key={j} />
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
