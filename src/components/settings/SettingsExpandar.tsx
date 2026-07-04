import { cn } from "@/lib/utils";
import { ChevronDown24Regular } from "@fluentui/react-icons";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { motion } from "framer-motion";

interface SettingsExpandarProps {
	title: string;
	subtitle?: string;
	children?: React.ReactNode;
	className?: string;
	icon?: React.ReactNode;
	trailing?: React.ReactNode;
}

export default function SettingsExpandar({
	title,
	subtitle,
	children,
	className,
	icon,
	trailing,
}: SettingsExpandarProps) {
	const [showDetail, setShowDetail] = useState(false);

	const hasDetail = children ? true : false;

	return (
		<div className="flex flex-col w-full gap-0">
			<div
				className={cn(
					"flex min-h-16 w-full flex-col justify-center rounded-md border border-foreground/[0.08] bg-card/55 px-5 py-3.5 transition-colors duration-150",
					showDetail && "rounded-b-none border-b-foreground/[0.06]",
					hasDetail && "hover:bg-foreground/[0.035]",
					className,
				)}
				onClick={() => setShowDetail((show) => !show)}
			>
				<div className="flex justify-between items-center">
					<div className="flex gap-4 items-center">
						<div className="size-7 flex items-center justify-center text-foreground/85 [&_svg]:size-5">
							{icon}
						</div>
						<div className="flex flex-col">
							<h2 className="text-[15px] font-medium leading-5 text-foreground">
								{title}
							</h2>
							{subtitle && (
								<p className="text-sm leading-5 text-foreground/52">
									{subtitle}
								</p>
							)}
						</div>
					</div>

					<div className="flex gap-2 items-center">
						{trailing}
						{hasDetail && (
							<motion.div
								animate={{ rotate: showDetail ? 180 : 0 }}
								transition={{ duration: 0.2, ease: "easeInOut" }}
								className="flex items-center justify-center"
							>
								<ChevronDown24Regular className="size-4" />
							</motion.div>
						)}
					</div>
				</div>
			</div>

			<AnimatePresence initial={false}>
				{showDetail && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2, ease: "easeInOut" }}
						className="overflow-hidden"
					>
						<div>{children}</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

interface SettingsExpandarDetailProps {
	desc?: string;
	trailing?: React.ReactNode;
	children?: React.ReactNode;
}

export function SettingsExpandarDetail({
	desc,
	trailing,
	children,
}: SettingsExpandarDetailProps) {
	return (
		<div className="flex min-h-14 w-full items-center justify-between border border-t-0 border-foreground/[0.08] bg-card/35 px-5 py-3 last:rounded-b-md">
			<p className="text-sm font-normal text-foreground/82">{desc}</p>
			{trailing}
			{children}
		</div>
	);
}
