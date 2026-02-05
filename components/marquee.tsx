import { useInView } from "framer-motion";
import { Children, ReactNode, useEffect, useRef, useState } from "react";

const marqueeContainerStyles: React.CSSProperties = {
  position: "relative",
  widows: "100%",
  overflow: "hidden",
};

const marqueeItemsStyles = (
  startPosition: number,
  time: number,
  direction?: string,
  willChange?: boolean,
): React.CSSProperties => ({
  display: "inline-block",
  whiteSpace: "nowrap",
  transform: `translate3d(-${startPosition}px, 0, 0)`,
  animationName: "marqueeScroll",
  animationDuration: `${time}s`,
  animationTimingFunction: "linear",
  animationIterationCount: "infinite",
  animationPlayState: "var(--marquee-play)",
  animationDirection: direction === "right" ? "reverse" : undefined,
  ...(willChange && { willChange: "transform" }),
});

const marqueeItemStyles = (marginRight: string): React.CSSProperties => ({
  position: "relative",
  display: "inline-block",
  marginRight: marginRight,
});

const getClonedItems = (
  items: (string | number | React.ReactNode)[],
  copyTimes = 1,
): (string | number)[] => {
  return Array(copyTimes).fill(items).flat();
};

interface MarqueeTextProps {
  children?: ReactNode;
  className?: string;
  duration?: number;
  direction?: "left" | "right";
  textSpacing?: string;
  pauseOnHover?: boolean;
  playOnlyInView?: boolean;
  threshold?: number;
}

const CSS = `
@keyframes marqueeScroll {
  to {
    transform: translate3d(0, 0, 0);
  }
}
`;

function injectMarqueeStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById("react-marquee-text-styles")) return;
  const style = document.createElement("style");
  style.id = "react-marquee-text-styles";
  style.textContent = CSS;
  document.head.appendChild(style);
}

const MarqueeText: React.FC<MarqueeTextProps> = ({
  className = "marquee",
  duration = 50,
  direction = "left",
  pauseOnHover = false,
  playOnlyInView = true,
  textSpacing = "0.15em",
  threshold = 0.1,
  children,
}: MarqueeTextProps) => {
  const marqueeContainer = useRef<HTMLDivElement>(null);
  const marqueeItems = useRef<HTMLDivElement>(null);
  const [translateFrom, setTransletFrom] = useState(0);
  const [showItems, setShowItems] = useState(Children.toArray(children));
  const [initialDuration, setInitialDuration] = useState(duration);
  const [isPlaying, setIsPlaying] = useState(true);

  const isVisible = useInView(marqueeContainer, {
    margin: "10px",
    amount: threshold,
    once: false,
  });

  useEffect(() => {
    injectMarqueeStyles();
  }, []);

  useEffect(() => {
    const containerWidth = Math.floor(marqueeContainer.current!.offsetWidth);
    const itemsWidth = Math.floor(marqueeItems.current!.scrollWidth);
    const cloneItems = Math.max(2, Math.ceil(containerWidth / 2 / itemsWidth));
    const translateFromVal = itemsWidth * Math.floor(cloneItems / 2);
    const durationVal =
      duration * parseFloat((translateFromVal / containerWidth).toFixed(2));

    setShowItems(getClonedItems(Children.toArray(children), cloneItems));
    setTransletFrom(translateFromVal);
    setInitialDuration(durationVal);
  }, [children, duration]);

  useEffect(() => {
    if (!playOnlyInView) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isVisible) setIsPlaying(true);
    else setIsPlaying(false);
  }, [isVisible, playOnlyInView]);

  function handleMouseEnter() {
    if (pauseOnHover) setIsPlaying(false);
  }

  function handleMouseLeave() {
    if (pauseOnHover) setIsPlaying(true);
  }

  return (
    <div
      ref={marqueeContainer}
      className={`${className}`}
      style={{
        ...marqueeContainerStyles,
        ["--marquee-play" as string]: isPlaying ? "running" : "paused",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`${className}__items`}
        style={marqueeItemsStyles(translateFrom, initialDuration, direction)}
        ref={marqueeItems}
      >
        {showItems.map((item, index) => (
          <div
            className={`${className}__item`}
            style={marqueeItemStyles(textSpacing)}
            key={index}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarqueeText;
