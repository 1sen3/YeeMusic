import { Skeleton } from "../ui/skeleton";

const ROW_KEYS = ["a", "b", "c", "d", "e", "f", "g", "h"];

export function HomeSectionSkeleton() {
	return (
		<div className="flex w-full flex-col gap-4">
			<Skeleton className="h-7 w-44 rounded-md" />
			<div className="grid grid-cols-8 gap-8">
				{ROW_KEYS.map((key) => (
					<div key={key} className="flex w-full flex-col gap-3">
						<Skeleton className="aspect-square w-full rounded-lg" />
						<Skeleton className="h-4 w-3/4" />
					</div>
				))}
			</div>
		</div>
	);
}
