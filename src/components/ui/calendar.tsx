"use client";

import { CaretDown12Filled, CaretUp12Filled } from "@fluentui/react-icons";
import { useState } from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { zhCN } from "react-day-picker/locale";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

type CalendarView = "days" | "months" | "years";

const toMonthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth();

const navButtonClassName =
	"inline-flex size-8 items-center justify-center rounded-md text-foreground/80 transition-colors hover:bg-foreground/[0.06] hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

const gridCellClassName =
	"flex size-14 select-none items-center justify-center rounded-full text-sm transition-colors hover:bg-foreground/[0.06] disabled:pointer-events-none disabled:opacity-30";

export function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	locale = zhCN,
	month: monthProp,
	defaultMonth,
	onMonthChange,
	startMonth,
	endMonth,
	...props
}: CalendarProps) {
	const defaultClassNames = getDefaultClassNames();

	const [view, setView] = useState<CalendarView>("days");
	const [internalMonth, setInternalMonth] = useState<Date>(() => {
		const initial = monthProp ?? defaultMonth ?? new Date();
		return new Date(initial.getFullYear(), initial.getMonth(), 1);
	});
	// 月份/年份网格视图正在浏览的年份，独立于当前选中的月份
	const [cursorYear, setCursorYear] = useState(() =>
		internalMonth.getFullYear(),
	);

	const month = monthProp
		? new Date(monthProp.getFullYear(), monthProp.getMonth(), 1)
		: internalMonth;

	const setMonth = (next: Date) => {
		setInternalMonth(next);
		onMonthChange?.(next);
	};

	const minIndex = startMonth
		? toMonthIndex(startMonth)
		: Number.NEGATIVE_INFINITY;
	const maxIndex = endMonth ? toMonthIndex(endMonth) : Number.POSITIVE_INFINITY;

	const decadeStart = Math.floor(cursorYear / 10) * 10;

	const captionLabel =
		view === "days"
			? `${month.getFullYear()} 年 ${month.getMonth() + 1} 月`
			: view === "months"
				? `${cursorYear} 年`
				: `${decadeStart} - ${decadeStart + 9}`;

	const handleCaptionClick = () => {
		if (view === "days") {
			setCursorYear(month.getFullYear());
			setView("months");
		} else if (view === "months") {
			setView("years");
		}
	};

	const canNavigate = (direction: -1 | 1) => {
		if (view === "days") {
			const nextIndex = toMonthIndex(month) + direction;
			return nextIndex >= minIndex && nextIndex <= maxIndex;
		}
		if (view === "months") {
			const nextYear = cursorYear + direction;
			return nextYear * 12 <= maxIndex && nextYear * 12 + 11 >= minIndex;
		}
		const nextDecade = Math.floor((cursorYear + direction * 10) / 10) * 10;
		return (
			nextDecade * 12 <= maxIndex && (nextDecade + 9) * 12 + 11 >= minIndex
		);
	};

	const handleNavigate = (direction: -1 | 1) => {
		if (!canNavigate(direction)) return;
		if (view === "days") {
			setMonth(new Date(month.getFullYear(), month.getMonth() + direction, 1));
		} else {
			setCursorYear(cursorYear + direction * (view === "months" ? 1 : 10));
		}
	};

	// 月份视图：当年 12 个月 + 次年前 4 个月补齐 4x4 网格
	const monthCells = Array.from({ length: 16 }, (_, i) => {
		const year = cursorYear + Math.floor(i / 12);
		const monthOfYear = i % 12;
		const index = year * 12 + monthOfYear;
		return {
			key: index,
			label: `${monthOfYear + 1}月`,
			outside: i >= 12,
			disabled: index < minIndex || index > maxIndex,
			selected: index === toMonthIndex(month),
			onClick: () => {
				setMonth(new Date(year, monthOfYear, 1));
				setView("days");
			},
		};
	});

	// 年份视图：当前十年 + 下一个十年前 6 年补齐 4x4 网格
	const yearCells = Array.from({ length: 16 }, (_, i) => {
		const year = decadeStart + i;
		return {
			key: year,
			label: String(year),
			outside: i >= 10,
			disabled: year * 12 + 11 < minIndex || year * 12 > maxIndex,
			selected: year === month.getFullYear(),
			onClick: () => {
				setCursorYear(year);
				setView("months");
			},
		};
	});

	return (
		<div className={cn("w-fit", className)}>
			<div className="flex items-center justify-between border-border/60 border-b py-1.5 pr-2.5 pl-2">
				<button
					type="button"
					onClick={handleCaptionClick}
					disabled={view === "years"}
					className={cn(
						"flex h-8 select-none items-center rounded-md px-2 font-bold text-sm",
						view !== "years" && "transition-colors hover:bg-foreground/[0.06]",
					)}
				>
					{captionLabel}
				</button>
				<div className="flex items-center gap-1.5">
					<button
						type="button"
						aria-label="上一页"
						className={navButtonClassName}
						disabled={!canNavigate(-1)}
						onClick={() => handleNavigate(-1)}
					>
						<CaretUp12Filled className="size-3" />
					</button>
					<button
						type="button"
						aria-label="下一页"
						className={navButtonClassName}
						disabled={!canNavigate(1)}
						onClick={() => handleNavigate(1)}
					>
						<CaretDown12Filled className="size-3" />
					</button>
				</div>
			</div>

			{view === "days" ? (
				<DayPicker
					showOutsideDays={showOutsideDays}
					locale={locale}
					month={month}
					onMonthChange={setMonth}
					startMonth={startMonth}
					endMonth={endMonth}
					hideNavigation
					className="p-3"
					classNames={{
						root: cn("relative", defaultClassNames.root),
						months: cn("flex flex-col", defaultClassNames.months),
						month: cn("flex flex-col", defaultClassNames.month),
						month_caption: "hidden",
						month_grid: cn("border-collapse", defaultClassNames.month_grid),
						weekdays: cn("flex", defaultClassNames.weekdays),
						weekday: cn(
							"flex size-10 select-none items-center justify-center font-normal text-foreground/90 text-xs",
							defaultClassNames.weekday,
						),
						week: cn("mt-0.5 flex w-full", defaultClassNames.week),
						day: cn(
							"group/day relative size-10 select-none p-0 text-center text-sm",
							defaultClassNames.day,
						),
						day_button: cn(
							"flex size-10 items-center justify-center rounded-full font-normal leading-none transition-colors",
							"hover:bg-foreground/[0.06]",
							"group-data-[selected=true]/day:bg-primary group-data-[selected=true]/day:font-medium group-data-[selected=true]/day:text-primary-foreground group-data-[selected=true]/day:hover:bg-primary",
							defaultClassNames.day_button,
						),
						today: cn(
							"font-medium text-primary data-[selected=true]:text-primary-foreground",
							defaultClassNames.today,
						),
						outside: cn("text-foreground/30", defaultClassNames.outside),
						disabled: cn(
							"text-foreground/25 opacity-50",
							defaultClassNames.disabled,
						),
						hidden: cn("invisible", defaultClassNames.hidden),
						...classNames,
					}}
					{...props}
				/>
			) : (
				<div className="grid w-[280px] grid-cols-4 place-items-center gap-y-1 p-3">
					{(view === "months" ? monthCells : yearCells).map((cell) => (
						<button
							key={cell.key}
							type="button"
							disabled={cell.disabled}
							onClick={cell.onClick}
							className={cn(
								gridCellClassName,
								cell.outside && "text-foreground/30",
								cell.selected &&
									"bg-primary font-medium text-primary-foreground hover:bg-primary",
							)}
						>
							{cell.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
