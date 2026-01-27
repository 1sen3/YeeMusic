import { useEffect, useRef, useState } from "react";

export function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return { ref, width };
}
