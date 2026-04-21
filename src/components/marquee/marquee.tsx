import { cn } from "@/lib/utils";
import styles from "./marquee.module.css";
import { useEffect, useRef, useState } from "react";

export function Marquee({
  text,
  textClassName,
  containerClassName,
}: {
  text: string;
  textClassName?: string;
  containerClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const isOverflowing =
          textRef.current.scrollWidth > containerRef.current.clientWidth;
        setShouldAnimate(isOverflowing);
      }
    };

    checkOverflow();
  }, [text]);

  const content = (
    <div className="flex">
      <span ref={textRef} className={cn("whitespace-nowrap", textClassName)}>
        {text}
      </span>
      {shouldAnimate &&
        [...Array(3)].map((_, i) => (
          <span
            key={`marquee-${i}`}
            className={cn("mx-4 whitespace-nowrap", textClassName)}
          >
            {text}
          </span>
        ))}
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        containerClassName,
        styles.marqueeWrapper,
      )}
      style={{
        WebkitMaskImage: shouldAnimate
          ? "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)"
          : "none",
      }}
    >
      <div className={cn(shouldAnimate && styles.marqueeContainer)}>
        <div className="flex">{content}</div>
        {shouldAnimate && <div className="flex">{content}</div>}
      </div>
    </div>
  );
}
