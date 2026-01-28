"use client";

import { ArrowClockwise24Regular } from "@fluentui/react-icons";
import { Button } from "./ui/button";
import { useTitlebar } from "@/contexts/titlebar-context";
import { cn } from "@/lib/utils";
import { MyTooltip } from "./my-tooltip";

export function Titlebar() {
  const { title, onRefresh, isRefreshing } = useTitlebar();

  const handleRefresh = () => {
    if (onRefresh && !isRefreshing) {
      onRefresh();
    }
  };

  return (
    <div className="w-full h-20 py-6 sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="w-full flex justify-between items-center px-8">
        <h1 className="text-xl font-semibold text-gray-700">{title}</h1>
        {onRefresh && (
          <MyTooltip tooltip="刷新" sideOffset={0}>
            <Button
              className="cursor-pointer"
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <ArrowClockwise24Regular
                className={cn(isRefreshing && "animate-spin")}
              />
            </Button>
          </MyTooltip>
        )}
      </div>
    </div>
  );
}
