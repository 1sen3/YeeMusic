import { cn } from "@/lib/utils";
import { createContext, useContext, useEffect, useRef, useState } from "react";

const PopoverContext = createContext<{
  closePopover: () => void;
} | null>(null);

interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Popover({ trigger, children, className }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPositionStyle({});
      return;
    }

    const adjustPosition = () => {
      const el = contentRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const styles: React.CSSProperties = {};

      if (rect.right > vw) {
        styles.left = "auto";
        styles.right = "0";
      }

      if (rect.bottom > vh) {
        styles.top = "auto";
        styles.bottom = "100%";
        styles.marginBottom = "0.5rem";
        styles.marginTop = "0";
      }

      setPositionStyle(styles);
    };

    const raf = requestAnimationFrame(adjustPosition);
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  return (
    <PopoverContext.Provider value={{ closePopover: () => setIsOpen(false) }}>
      <div className="relative" ref={containerRef}>
        <div onClick={() => setIsOpen(!isOpen)} className="inline-block">
          {trigger}
        </div>

        <div
          ref={contentRef}
          style={positionStyle}
          className={cn(
            "absolute top-full mt-2 left-0 z-50 min-w-[120px] flex flex-col gap-1 p-2",
            "bg-card/80 backdrop-blur-md rounded-md border drop-shadow-2xl transition-all duration-300",
            isOpen
              ? "opacity-100 pointer-events-auto translate-y-0"
              : "opacity-0 pointer-events-none -translate-y-2",
            className,
          )}
        >
          {children}
        </div>
      </div>
    </PopoverContext.Provider>
  );
}

interface PopoverItemProps {
  isActive?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function PopoverItem({
  isActive = false,
  onClick,
  children,
}: PopoverItemProps) {
  const context = useContext(PopoverContext);

  const handleClick = () => {
    onClick?.();
    context?.closePopover();
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "w-full px-4 py-2 rounded-sm text-sm cursor-pointer hover:bg-foreground/8 relative transition-colors",
        isActive && "bg-foreground/5 text-primary font-medium",
      )}
    >
      {children}
      {isActive && (
        <div className="absolute w-1 h-1/2 bg-primary rounded-full left-0 top-1/2 -translate-y-1/2" />
      )}
    </div>
  );
}
