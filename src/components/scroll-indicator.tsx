import { useRef, useState, useEffect } from "react";

export function ScrollIndicator() {
  const trackRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | undefined>(undefined);
  const isScrollerHoveringRef = useRef(false);
  const isTrackHoveringRef = useRef(false);
  const dragStateRef = useRef<{
    pointerId: number;
    startY: number;
    startScrollTop: number;
    maxScrollTop: number;
    maxThumbTop: number;
  } | null>(null);

  const [metrics, setMetrics] = useState({
    canScroll: false,
    visible: false,
    thumbTop: 8,
    thumbHeight: 32,
  });

  useEffect(() => {
    const scroller = document.getElementById("main-scroll-container");
    if (!scroller) return;

    const updateMetrics = (visible = metrics.visible) => {
      const { scrollTop, scrollHeight, clientHeight } = scroller;
      const canScroll = scrollHeight > clientHeight + 1;
      const trackHeight = Math.max(
        0,
        trackRef.current?.clientHeight ?? clientHeight - 16,
      );
      const thumbHeight = canScroll
        ? Math.max(32, (clientHeight / scrollHeight) * trackHeight)
        : 32;
      const maxScrollTop = Math.max(1, scrollHeight - clientHeight);
      const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
      const thumbTop = (scrollTop / maxScrollTop) * maxThumbTop;

      setMetrics({
        canScroll,
        visible: canScroll && visible,
        thumbTop,
        thumbHeight,
      });
    };

    const isPointInsideTrack = (clientX: number, clientY: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return false;

      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    };

    const isPointerInsideInteractiveArea = () =>
      isScrollerHoveringRef.current ||
      isTrackHoveringRef.current ||
      !!dragStateRef.current;

    const scheduleHide = () => {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => {
        if (!isPointerInsideInteractiveArea()) {
          updateMetrics(false);
        }
      }, 700);
    };

    const handleScroll = () => {
      updateMetrics(true);
      scheduleHide();
    };

    const handleMouseEnter = () => {
      isScrollerHoveringRef.current = true;
      window.clearTimeout(hideTimerRef.current);
      updateMetrics(true);
    };

    const handleMouseLeave = (event: MouseEvent) => {
      const nextTarget = event.relatedTarget;
      if (
        nextTarget instanceof Node &&
        trackRef.current?.contains(nextTarget)
      ) {
        isTrackHoveringRef.current = true;
        isScrollerHoveringRef.current = false;
        updateMetrics(true);
        window.clearTimeout(hideTimerRef.current);
        return;
      }

      if (isPointInsideTrack(event.clientX, event.clientY)) {
        isTrackHoveringRef.current = true;
        isScrollerHoveringRef.current = false;
        updateMetrics(true);
        window.clearTimeout(hideTimerRef.current);
        return;
      }

      isScrollerHoveringRef.current = false;
      scheduleHide();
    };

    const resizeObserver = new ResizeObserver(() => {
      updateMetrics(isPointerInsideInteractiveArea());
    });

    updateMetrics(false);
    scroller.addEventListener("scroll", handleScroll, { passive: true });
    scroller.addEventListener("mouseenter", handleMouseEnter);
    scroller.addEventListener("mouseleave", handleMouseLeave);
    resizeObserver.observe(scroller);
    if (scroller.firstElementChild) {
      resizeObserver.observe(scroller.firstElementChild);
    }

    return () => {
      window.clearTimeout(hideTimerRef.current);
      scroller.removeEventListener("scroll", handleScroll);
      scroller.removeEventListener("mouseenter", handleMouseEnter);
      scroller.removeEventListener("mouseleave", handleMouseLeave);
      resizeObserver.disconnect();
    };
  }, []);

  if (!metrics.canScroll) return null;

  const scrollToPointer = (clientY: number) => {
    const scroller = document.getElementById("main-scroll-container");
    const track = trackRef.current;
    if (!scroller || !track) return;

    const trackRect = track.getBoundingClientRect();
    const trackHeight = trackRect.height;
    const maxScrollTop = Math.max(
      1,
      scroller.scrollHeight - scroller.clientHeight,
    );
    const maxThumbTop = Math.max(1, trackHeight - metrics.thumbHeight);
    const nextThumbTop = Math.min(
      maxThumbTop,
      Math.max(0, clientY - trackRect.top - metrics.thumbHeight / 2),
    );

    scroller.scrollTo({
      top: (nextThumbTop / maxThumbTop) * maxScrollTop,
      behavior: "smooth",
    });
  };

  const handleTrackPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    scrollToPointer(event.clientY);
    setMetrics((current) => ({ ...current, visible: true }));
  };

  const handleTrackPointerEnter = () => {
    isTrackHoveringRef.current = true;
    window.clearTimeout(hideTimerRef.current);
    setMetrics((current) => ({ ...current, visible: current.canScroll }));
  };

  const handleTrackPointerLeave = () => {
    isTrackHoveringRef.current = false;
    if (dragStateRef.current) return;
    if (!isScrollerHoveringRef.current) {
      hideTimerRef.current = window.setTimeout(() => {
        setMetrics((current) => ({ ...current, visible: false }));
      }, 150);
    }
  };

  const handleThumbPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const scroller = document.getElementById("main-scroll-container");
    const track = trackRef.current;
    if (!scroller || !track) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    dragStateRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startScrollTop: scroller.scrollTop,
      maxScrollTop: Math.max(1, scroller.scrollHeight - scroller.clientHeight),
      maxThumbTop: Math.max(1, track.clientHeight - metrics.thumbHeight),
    };
    setMetrics((current) => ({ ...current, visible: true }));
  };

  const handleThumbPointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const scroller = document.getElementById("main-scroll-container");
    const dragState = dragStateRef.current;
    if (!scroller || !dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const deltaY = event.clientY - dragState.startY;
    scroller.scrollTop =
      dragState.startScrollTop +
      (deltaY / dragState.maxThumbTop) * dragState.maxScrollTop;
  };

  const handleThumbPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId !== event.pointerId) return;

    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (!isScrollerHoveringRef.current && !isTrackHoveringRef.current) {
      hideTimerRef.current = window.setTimeout(() => {
        setMetrics((current) => ({ ...current, visible: false }));
      }, 700);
    }
  };

  return (
    <div
      ref={trackRef}
      className="absolute inset-y-2 right-1 z-30 w-3 cursor-default"
      onPointerEnter={handleTrackPointerEnter}
      onPointerLeave={handleTrackPointerLeave}
      onPointerDown={handleTrackPointerDown}
    >
      <div
        className="absolute right-0 w-1 cursor-default rounded-full bg-black/30 opacity-0 transition-[opacity,width,background-color] duration-150 hover:w-1.5 dark:bg-white/35"
        onPointerDown={handleThumbPointerDown}
        onPointerMove={handleThumbPointerMove}
        onPointerUp={handleThumbPointerUp}
        onPointerCancel={handleThumbPointerUp}
        style={{
          height: metrics.thumbHeight,
          transform: `translateY(${metrics.thumbTop}px)`,
          opacity: metrics.visible ? 1 : 0,
        }}
      />
    </div>
  );
}
