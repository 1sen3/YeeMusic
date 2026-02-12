"use client";

import {
  ArrowClockwise24Regular,
  ArrowLeft24Filled,
  ArrowRight24Filled,
} from "@fluentui/react-icons";
import { Button } from "../ui/button";
import { useTitlebar } from "@/contexts/titlebar-context";
import { cn } from "@/lib/utils";
import { SearchInput } from "./search-input";

export function Titlebar() {
  const { onRefresh, isRefreshing } = useTitlebar();

  const handleRefresh = () => {
    if (onRefresh && !isRefreshing) {
      onRefresh();
    }
  };

  return (
    <div className="w-full h-16 py-6 top-0 z-50 bg-background  drop-shadow-xs">
      <div className="w-full h-full flex-1 flex justify-between items-center px-6">
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            size="icon"
            disabled={true}
          >
            <ArrowLeft24Filled className="size-4" />
          </Button>

          <Button
            variant="ghost"
            className="cursor-pointer"
            size="icon"
            disabled={true}
          >
            <ArrowRight24Filled className="size-4" />
          </Button>

          <SearchInput />
        </div>
        {onRefresh && (
          <Button
            className="cursor-pointer"
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <ArrowClockwise24Regular
              className={cn(isRefreshing && "animate-spin")}
            />
          </Button>
        )}
      </div>
    </div>
  );
}
