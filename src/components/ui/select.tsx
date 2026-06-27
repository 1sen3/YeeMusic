"use client";

import { IconCheck, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { Select as SelectPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

function Select({
	...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
	return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
	return (
		<SelectPrimitive.Group
			data-slot="select-group"
			className={cn("scroll-my-1 p-1", className)}
			{...props}
		/>
	);
}

function SelectValue({
	...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
	return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
	className,
	size = "default",
	children,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
	size?: "sm" | "default";
}) {
	return (
		<SelectPrimitive.Trigger
			data-slot="select-trigger"
			data-size={size}
			className={cn(
				"group/select flex w-fit items-center justify-between gap-2 whitespace-nowrap rounded-sm border border-border border-b-2 bg-card px-2.5 py-1.5 text-sm outline-none transition-colors select-none",
				"hover:bg-foreground/5 data-[state=open]:bg-foreground/5 data-[placeholder]:text-muted-foreground",
				"focus-visible:border-border focus-visible:ring-2 focus-visible:ring-ring/40",
				"aria-invalid:border-destructive/50 aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
				"disabled:cursor-not-allowed disabled:opacity-50",
				"data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:px-2 data-[size=sm]:text-xs",
				"*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5",
				"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		>
			{children}
			<SelectPrimitive.Icon asChild>
				<IconChevronDown className="pointer-events-none size-4 text-muted-foreground transition-transform duration-150 group-data-[state=open]/select:rotate-180" />
			</SelectPrimitive.Icon>
		</SelectPrimitive.Trigger>
	);
}

function SelectContent({
	className,
	children,
	position = "item-aligned",
	align = "center",
	...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Content
				data-slot="select-content"
				data-align-trigger={position === "item-aligned"}
				className={cn(
					"relative z-50 max-h-(--radix-select-content-available-height) min-w-36 origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border bg-card/80 p-1 text-popover-foreground drop-shadow-2xl backdrop-blur-md",
					"data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 duration-150",
					"data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
					"data-[align-trigger=true]:animate-none",
					position === "popper" &&
						"data-[side=bottom]:translate-y-2 data-[side=left]:-translate-x-2 data-[side=right]:translate-x-2 data-[side=top]:-translate-y-2",
					className,
				)}
				position={position}
				align={align}
				{...props}
			>
				<SelectScrollUpButton />
				<SelectPrimitive.Viewport
					data-position={position}
					className={cn(
						"flex flex-col gap-1 data-[position=popper]:w-full data-[position=popper]:min-w-[var(--radix-select-trigger-width)]",
					)}
				>
					{children}
				</SelectPrimitive.Viewport>
				<SelectScrollDownButton />
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	);
}

function SelectLabel({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
	return (
		<SelectPrimitive.Label
			data-slot="select-label"
			className={cn("text-muted-foreground px-1.5 py-1 text-xs", className)}
			{...props}
		/>
	);
}

function SelectItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
	return (
		<SelectPrimitive.Item
			data-slot="select-item"
			className={cn(
				"group/select-item relative flex w-full cursor-default items-center gap-2 rounded-sm py-2 pr-8 pl-4 text-sm outline-none select-none transition-colors",
				"focus:bg-foreground/8 data-[state=checked]:bg-foreground/5 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
				"*:data-[slot=select-item-text]:line-clamp-1 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		>
			<span className="pointer-events-none absolute left-1 hidden h-1/2 w-1 rounded-full bg-primary group-data-[state=checked]/select-item:block" />
			<span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center text-primary">
				<SelectPrimitive.ItemIndicator>
					<IconCheck className="pointer-events-none" />
				</SelectPrimitive.ItemIndicator>
			</span>
			<SelectPrimitive.ItemText data-slot="select-item-text">
				{children}
			</SelectPrimitive.ItemText>
		</SelectPrimitive.Item>
	);
}

function SelectSeparator({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
	return (
		<SelectPrimitive.Separator
			data-slot="select-separator"
			className={cn("bg-border -mx-1 my-1 h-px pointer-events-none", className)}
			{...props}
		/>
	);
}

function SelectScrollUpButton({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
	return (
		<SelectPrimitive.ScrollUpButton
			data-slot="select-scroll-up-button"
			className={cn(
				"z-10 flex cursor-default items-center justify-center rounded-sm py-1 text-muted-foreground [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		>
			<IconChevronUp />
		</SelectPrimitive.ScrollUpButton>
	);
}

function SelectScrollDownButton({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
	return (
		<SelectPrimitive.ScrollDownButton
			data-slot="select-scroll-down-button"
			className={cn(
				"z-10 flex cursor-default items-center justify-center rounded-sm py-1 text-muted-foreground [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		>
			<IconChevronDown />
		</SelectPrimitive.ScrollDownButton>
	);
}

export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectScrollDownButton,
	SelectScrollUpButton,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
};
