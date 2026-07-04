"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Switch({
	className,
	size = "default",
	...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
	size?: "sm" | "default";
}) {
	return (
		<SwitchPrimitive.Root
			data-slot="switch"
			data-size={size}
			className={cn(
				"data-checked:bg-primary data-unchecked:bg-foreground/18 focus-visible:border-ring focus-visible:ring-ring/40 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 dark:data-unchecked:bg-white/22 shrink-0 rounded-full border border-transparent focus-visible:ring-2 aria-invalid:ring-2 data-[size=default]:h-5 data-[size=default]:w-10 data-[size=sm]:h-4 data-[size=sm]:w-8 peer group/switch relative inline-flex items-center transition-colors duration-150 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 data-disabled:cursor-not-allowed data-disabled:opacity-50",
				className,
			)}
			{...props}
		>
			<SwitchPrimitive.Thumb
				data-slot="switch-thumb"
				className="bg-card shadow-[0_1px_2px_rgba(0,0,0,0.16)] dark:data-unchecked:bg-card dark:data-checked:bg-primary-foreground pointer-events-none block rounded-full ring-0 transition-transform duration-150 group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3.5 group-data-[size=default]/switch:data-unchecked:translate-x-0.5 group-data-[size=default]/switch:data-checked:translate-x-[22px] group-data-[size=sm]/switch:data-unchecked:translate-x-0.5 group-data-[size=sm]/switch:data-checked:translate-x-[14px]"
			/>
		</SwitchPrimitive.Root>
	);
}

export { Switch };
