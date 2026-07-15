import { Add20Regular, Subtract20Regular } from "@fluentui/react-icons";
import { type KeyboardEvent, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface NumberStepperProps {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	precision?: number;
	className?: string;
	onValueChange: (value: number) => void;
}

function NumberStepper({
	label,
	value,
	min,
	max,
	step,
	precision = getDecimalPlaces(step),
	className,
	onValueChange,
}: NumberStepperProps) {
	const [draft, setDraft] = useState(formatNumber(value, precision));

	useEffect(() => {
		setDraft(formatNumber(value, precision));
	}, [value, precision]);

	const normalize = (nextValue: number) => {
		const stepIndex = Math.round((nextValue - min) / step);
		const steppedValue = min + stepIndex * step;
		const clampedValue = Math.min(max, Math.max(min, steppedValue));
		return Number(clampedValue.toFixed(precision));
	};

	const commit = (nextDraft = draft) => {
		const parsed = Number(nextDraft);
		const nextValue = Number.isFinite(parsed) ? normalize(parsed) : value;
		setDraft(formatNumber(nextValue, precision));
		if (nextValue !== value) onValueChange(nextValue);
	};

	const adjust = (delta: number) => {
		const nextValue = normalize(value + delta);
		setDraft(formatNumber(nextValue, precision));
		if (nextValue !== value) onValueChange(nextValue);
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			adjust(-step);
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			adjust(step);
		} else if (event.key === "Enter") {
			event.currentTarget.blur();
		}
	};

	return (
		<div
			className={cn(
				"flex h-8 overflow-hidden rounded-sm border border-b-2 border-input bg-muted/60 text-foreground transition-colors focus-within:border-b-primary dark:bg-input/30",
				className,
			)}
		>
			<button
				type="button"
				className="flex size-[30px] shrink-0 items-center justify-center border-r border-input transition-colors hover:bg-foreground/[0.06] active:bg-foreground/[0.1] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground disabled:pointer-events-none disabled:opacity-40"
				aria-label={`减小${label}`}
				disabled={value <= min}
				onClick={() => adjust(-step)}
			>
				<Subtract20Regular className="size-4" />
			</button>
			<input
				type="text"
				inputMode="decimal"
				role="spinbutton"
				aria-label={label}
				aria-valuemin={min}
				aria-valuemax={max}
				aria-valuenow={value}
				className="h-[30px] w-14 bg-transparent px-1 text-center text-sm tabular-nums outline-none"
				value={draft}
				onChange={(event) => {
					if (/^-?\d*(?:\.\d*)?$/.test(event.target.value)) {
						setDraft(event.target.value);
					}
				}}
				onBlur={() => commit()}
				onKeyDown={handleKeyDown}
			/>
			<button
				type="button"
				className="flex size-[30px] shrink-0 items-center justify-center border-l border-input transition-colors hover:bg-foreground/[0.06] active:bg-foreground/[0.1] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground disabled:pointer-events-none disabled:opacity-40"
				aria-label={`增大${label}`}
				disabled={value >= max}
				onClick={() => adjust(step)}
			>
				<Add20Regular className="size-4" />
			</button>
		</div>
	);
}

function getDecimalPlaces(value: number) {
	const decimal = String(value).split(".")[1];
	return decimal?.length ?? 0;
}

function formatNumber(value: number, precision: number) {
	return value.toFixed(precision);
}

export { NumberStepper };
