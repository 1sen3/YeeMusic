"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Slider({
	className,
	defaultValue,
	value,
	min = 0,
	max = 100,
	...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
	const _values = React.useMemo(
		() =>
			Array.isArray(value)
				? value
				: Array.isArray(defaultValue)
					? defaultValue
					: [min, max],
		[value, defaultValue, min, max],
	);

	return (
		<SliderPrimitive.Root
			data-slot="slider"
			defaultValue={defaultValue}
			value={value}
			min={min}
			max={max}
			className={cn(
				"data-vertical:min-h-40 relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:w-auto data-vertical:flex-col",
				className,
			)}
			{...props}
		>
			<SliderPrimitive.Track
				data-slot="slider-track"
				className="bg-foreground/16 rounded-full data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1 relative grow overflow-hidden"
			>
				<SliderPrimitive.Range
					data-slot="slider-range"
					className="bg-primary absolute select-none data-horizontal:h-full data-vertical:w-full"
				/>
			</SliderPrimitive.Track>
			{Array.from({ length: _values.length }, (_, index) => (
				<SliderPrimitive.Thumb
					key={index}
					data-slot="slider-thumb"
					className={cn(
						"relative block size-5 shrink-0 rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.08)] transition-[color,box-shadow] after:absolute after:-inset-2 focus-visible:outline-hidden select-none disabled:pointer-events-none disabled:opacity-50",
						"before:absolute before:top-1/2 before:left-1/2 before:size-2.5 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-primary before:content-[''] before:transition-[width,height,opacity] before:duration-150 hover:before:size-3 active:before:size-2 active:before:opacity-70",
					)}
				/>
			))}
		</SliderPrimitive.Root>
	);
}

export { Slider };
