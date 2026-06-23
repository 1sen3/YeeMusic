import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.ComponentProps<"input"> {
	showIndicator?: boolean;
	containerClassName?: string;
}

function Input({
	containerClassName,
	className,
	type,
	showIndicator = true,
	...props
}: InputProps) {
	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-sm  group",
				containerClassName,
			)}
		>
			<input
				type={type}
				data-slot="input"
				className={cn(
					"bg-muted/60 dark:bg-input/30 border-input aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 h-8 rounded-sm border px-2.5 py-1 text-base transition-colors file:h-6 file:text-sm file:font-medium aria-invalid:ring-[3px] md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
					showIndicator ? "border-b-2" : "border-b-2",
					"overflow-hidden",
					className,
				)}
				{...props}
			/>

			{showIndicator && (
				<div
					className={cn(
						"w-full h-[2px] bg-primary absolute bottom-0 left-0",
						"scale-x-0 transition-transform duration-300 ease-in-out",
						"group-focus-within:scale-x-100",
					)}
				/>
			)}
		</div>
	);
}

export { Input };
