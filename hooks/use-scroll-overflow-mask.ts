import React, { useCallback, useMemo, useState } from "react";

export function useScrollOverflowMask(
  totalHeight: number,
  containerHeight: number,
) {
  const [scrollState, setScrollState] = useState<"top" | "middle" | "bottom">(
    "top",
  );

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const scrollOffset = event.currentTarget.scrollTop;
      const maxScroll = totalHeight - containerHeight;

      if (scrollOffset <= 0) {
        setScrollState("top");
      } else if (scrollOffset >= maxScroll - 1) {
        setScrollState("middle");
      } else {
        setScrollState("bottom");
      }
    },
    [totalHeight, containerHeight],
  );

  const maskImage = useMemo(() => {
    switch (scrollState) {
      case "top":
        return "linear-gradient(to bottom, black 0%, black 90%, transparent 100%)";
      case "bottom":
        return "linear-gradient(to bottom, transparent 0%, black 10%, black 100%)";
      case "middle":
      default:
        return "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)";
    }
  }, [scrollState]);

  return { handleScroll, maskImage };
}
