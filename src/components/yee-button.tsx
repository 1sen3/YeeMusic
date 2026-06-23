import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface YeeButtonProps
	extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "content"> {
	variant?: "default" | "outline" | "glass" | "ghost";
	size?:
		| "default"
		| "xs"
		| "sm"
		| "lg"
		| "icon"
		| "icon-xs"
		| "icon-sm"
		| "icon-lg";
	icon?: React.ReactNode;
	content?: React.ReactNode;
	disabled?: boolean;
	className?: string;
}

const buttonVariantMap = {
	default: "winui",
	outline: "floating",
	glass: "glass",
	ghost: "ghost",
} as const;

export const YeeButton = React.forwardRef<HTMLButtonElement, YeeButtonProps>(
	(
		{
			variant = "ghost",
			size,
			icon,
			content,
			children,
			disabled,
			className,
			...props
		},
		ref,
	) => {
		const buttonContent = content ?? children ?? icon;
		const isDefaultVariant = variant === "default";
		const isGlassVariant = variant === "glass";
		const resolvedSize = size ?? (isDefaultVariant ? "default" : "icon");
		const tapScale = isDefaultVariant ? 0.985 : isGlassVariant ? 0.995 : 0.97;
		const hoverScale = isDefaultVariant ? undefined : 1.025;

		return (
			<motion.div
				whileTap={!disabled ? { scale: tapScale } : {}}
				whileHover={!disabled && hoverScale ? { scale: hoverScale } : {}}
				transition={{ type: "spring", stiffness: 520, damping: 34, mass: 0.7 }}
			>
				<Button
					ref={ref}
					variant={buttonVariantMap[variant]}
					size={resolvedSize}
					className={className}
					disabled={disabled}
					{...props}
				>
					{buttonContent}
				</Button>
			</motion.div>
		);
	},
);

YeeButton.displayName = "YeeButton";
