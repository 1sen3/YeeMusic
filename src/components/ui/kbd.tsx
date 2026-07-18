import { cn } from "@/lib/utils";

export function Kbd({
	className,
	...props
}: React.HTMLAttributes<HTMLElement>) {
	return (
		<kbd
			className={cn(
				"inline-flex h-6 min-w-6 items-center justify-center rounded-[5px] border border-foreground/[0.12] bg-card px-1.5 font-sans text-xs font-medium tracking-wide text-foreground/80 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]",
				className,
			)}
			{...props}
		/>
	);
}
