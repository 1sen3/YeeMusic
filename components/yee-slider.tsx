"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useState } from "react";

interface YeeSliderProps extends Omit<
  React.ComponentProps<typeof SliderPrimitive.Root>,
  "onValueChange"
> {
  tooltip?: string;
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
  trackClassName,
  rangeClassName,
  showThumb = true,
  onValueChange,
  ...props
}: YeeSliderProps) {
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);

  return (
    <TooltipProvider>
      <SliderPrimitive.Root
        data-slot="slider"
        defaultValue={defaultValue}
        value={isDragging ? [dragValue] : value}
        min={min}
        max={max}
        className={cn(
          "group cursor-pointer data-vertical:min-h-40 relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:w-auto data-vertical:flex-col",
          className,
        )}
        {...props}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
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
                  className={cn("opacity-0")}
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

export { YeeSlider };
