"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import { cn, formatTime } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useState } from "react";

interface PlayerDurationSliderProps extends React.ComponentProps<
  typeof SliderPrimitive.Root
> {
  tooltip?: string;
  trackClassName?: string;
  rangeClassName?: string;
  showThumb?: boolean;
}

function PlayerDurationSlider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  tooltip,
  trackClassName,
  rangeClassName,
  showThumb = true,
  ...props
}: PlayerDurationSliderProps) {
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

  return (
    <TooltipProvider>
      <SliderPrimitive.Root
        data-slot="slider"
        defaultValue={defaultValue}
        value={value}
        min={min}
        max={max}
        className={cn(
          "group cursor-pointer data-vertical:min-h-40 relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:w-auto data-vertical:flex-col",
          className,
        )}
        {...props}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className={cn(
            "rounded-full data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1 relative grow overflow-hidden",
            trackClassName,
          )}
        >
          <SliderPrimitive.Range
            data-slot="slider-range"
            className={cn(
              "rounded-full  absolute select-none data-horizontal:h-full data-vertical:w-full",
              rangeClassName,
            )}
          />
        </SliderPrimitive.Track>
        {showThumb &&
          Array.from({ length: _values.length }, (_, index) => (
            <Tooltip key={index} open={showTooltip}>
              <TooltipTrigger asChild>
                <SliderPrimitive.Thumb
                  data-slot="slider-thumb"
                  className={cn(
                    "border-ring ring-ring/50 relative size-3 rounded-full border bg-white transition-[color,box-shadow] after:absolute after:-inset-2 hover:ring-[3px] focus-visible:ring-[3px] focus-visible:outline-hidden active:ring-[3px] block shrink-0 select-none disabled:pointer-events-none disabled:opacity-50",
                    "opacity-0 group-hover:opacity-100",
                  )}
                >
                  <TooltipContent>
                    <p>{tooltip || value}</p>
                  </TooltipContent>
                </SliderPrimitive.Thumb>
              </TooltipTrigger>
            </Tooltip>
          ))}
      </SliderPrimitive.Root>
    </TooltipProvider>
  );
}

export { PlayerDurationSlider };
