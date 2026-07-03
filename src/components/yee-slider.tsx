"use client";

import { Slider as SliderPrimitive } from "radix-ui";
import * as React from "react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const sliderFloatingTooltipClassName =
  "select-none animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-1 z-50 w-fit max-w-xs rounded-sm border border-black/10 bg-white/95 px-2.5 py-1.5 text-xs font-medium text-zinc-900 shadow-[0_2px_6px_rgba(0,0,0,0.14),0_1px_2px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-800/95 dark:text-zinc-50 dark:shadow-[0_3px_8px_rgba(0,0,0,0.32),0_1px_2px_rgba(0,0,0,0.22)]";

interface YeeSliderProps extends Omit<
  React.ComponentProps<typeof SliderPrimitive.Root>,
  "onValueChange"
> {
  tooltip?: string;
  hoverTooltip?: (value: number) => string;
  trackClassName?: string;
  rangeClassName?: string;
  showThumb?: boolean;
  onValueChange: (value: number) => void;
}

function YeeSlider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  tooltip,
  hoverTooltip,
  trackClassName,
  rangeClassName,
  showThumb = true,
  onValueChange,
  ...props
}: YeeSliderProps) {
  const sliderRef = useRef<HTMLSpanElement>(null);
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  );
  const [showTooltip, setShowTooltip] = useState(false);
  const [showHoverTooltip, setShowHoverTooltip] = useState(false);
  const [hoverState, setHoverState] = useState({ value: min, left: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const shouldTrackHover = Boolean(hoverTooltip);
  const shouldShowThumbTooltip = showThumb;

  const updateHoverState = (clientX: number) => {
    if (!shouldTrackHover) return;
    const slider = sliderRef.current;
    if (!slider) return;
    const rect = slider.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setHoverState({
      value: min + ratio * (max - min),
      left: ratio * rect.width,
    });
  };

  return (
    <TooltipProvider>
      <SliderPrimitive.Root
        ref={sliderRef}
        data-slot="slider"
        defaultValue={defaultValue}
        value={isDragging ? [dragValue] : value}
        min={min}
        max={max}
        className={cn(
          "group relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col",
          className,
        )}
        {...props}
        onMouseEnter={(event) => {
          if (shouldShowThumbTooltip) setShowTooltip(true);
          if (shouldTrackHover) {
            setShowHoverTooltip(true);
            updateHoverState(event.clientX);
          }
        }}
        onMouseMove={(event) => {
          if (shouldTrackHover) updateHoverState(event.clientX);
        }}
        onMouseLeave={() => {
          if (shouldShowThumbTooltip) setShowTooltip(false);
          if (shouldTrackHover) setShowHoverTooltip(false);
        }}
        onValueChange={(value) => {
          setIsDragging(true);
          setDragValue(value[0]);
        }}
        onValueCommit={(value) => {
          onValueChange(value[0]);
          setIsDragging(false);
        }}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={cn(
            "relative grow overflow-hidden rounded-full data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1",
            trackClassName,
          )}
        >
          <SliderPrimitive.Range
            data-slot="slider-range"
            className={cn(
              "absolute rounded-full select-none data-horizontal:h-full data-vertical:w-full",
              rangeClassName,
            )}
          />
        </SliderPrimitive.Track>
        {showThumb &&
          _values.map((sliderValue) => (
            <Tooltip key={sliderValue} open={showTooltip}>
              <TooltipTrigger asChild>
                <SliderPrimitive.Thumb
                  data-slot="slider-thumb"
                  className={cn("opacity-0")}
                />
              </TooltipTrigger>
              <TooltipContent sideOffset={10}>
                <p>{tooltip || value}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        {hoverTooltip && showHoverTooltip && !isDragging && (
          <div
            className={cn(
              "pointer-events-none absolute bottom-full mb-2 -translate-x-1/2",
              sliderFloatingTooltipClassName,
            )}
            style={{ left: hoverState.left }}
          >
            {hoverTooltip(hoverState.value)}
          </div>
        )}
      </SliderPrimitive.Root>
    </TooltipProvider>
  );
}

export { YeeSlider };
