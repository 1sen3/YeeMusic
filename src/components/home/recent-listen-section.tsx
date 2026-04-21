import { RecentListenResource } from "@/lib/types";
import ChromaGrid from "@/components/ChromaGrid";
import { Vibrant } from "node-vibrant/browser";
import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "@/lib/store/playerStore";
import { GetThumbnail } from "@/lib/utils";
import { CaretLeft24Filled, CaretRight24Filled } from "@fluentui/react-icons";
import { YeeButton } from "../yee-button";

export function RecentListenSection({
  resources,
}: {
  resources: RecentListenResource[];
}) {
  const [items, setItems] = useState<any[]>([]);
  const { playList } = usePlayerStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const getPagePositions = (container: HTMLDivElement) => {
    const childElements = Array.from(container.children) as HTMLElement[];
    if (childElements.length === 0) return [0];

    const containerRect = container.getBoundingClientRect();
    const maxScrollLeft = Math.max(
      0,
      container.scrollWidth - container.clientWidth,
    );
    const epsilon = 1;

    const itemPositions = childElements
      .map((child) => {
        const rect = child.getBoundingClientRect();
        const start = rect.left - containerRect.left + container.scrollLeft;
        return { start, end: start + rect.width };
      })
      .sort((a, b) => a.start - b.start);

    const pagePositions = [0];
    let pageEnd = container.clientWidth;

    for (const item of itemPositions) {
      if (item.end > pageEnd + epsilon) {
        const pageStart = Math.min(item.start, maxScrollLeft);
        pageEnd = pageStart + container.clientWidth;
        if (pageStart > pagePositions[pagePositions.length - 1] + epsilon) {
          pagePositions.push(pageStart);
        }
      }
    }

    if (maxScrollLeft > pagePositions[pagePositions.length - 1] + epsilon) {
      pagePositions.push(maxScrollLeft);
    }

    return pagePositions;
  };

  const updateScrollState = () => {
    const container = containerRef.current;
    if (!container) {
      setHasOverflow(false);
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const epsilon = 1;
    const overflow = maxScrollLeft > epsilon;
    const pagePositions = getPagePositions(container);
    const currentScrollLeft = container.scrollLeft;
    const firstPage = pagePositions[0] ?? 0;
    const lastPage = pagePositions[pagePositions.length - 1] ?? 0;

    setHasOverflow(overflow);
    setCanScrollPrev(currentScrollLeft > firstPage + epsilon);
    setCanScrollNext(overflow && currentScrollLeft < lastPage - epsilon);
  };

  const scrollToPage = (direction: 1 | -1) => {
    const container = containerRef.current;
    if (!container) return;
    const pagePositions = getPagePositions(container);
    const currentScrollLeft = container.scrollLeft;
    const epsilon = 1;

    const target =
      direction > 0
        ? (pagePositions.find((p) => p > currentScrollLeft + epsilon) ??
          currentScrollLeft)
        : ([...pagePositions]
            .reverse()
            .find((p) => p < currentScrollLeft - epsilon) ?? currentScrollLeft);

    container.scrollTo({ left: target, behavior: "smooth" });
  };

  useEffect(() => {
    let isMounted = true;

    const loadItems = async () => {
      const processedItems = await Promise.all(
        resources
          .filter((r) => r.resourceType !== "userfm")
          .map(async (res) => {
            const cover = GetThumbnail(res.coverUrlList?.[0]);
            const typeLink =
              res.resourceType === "list" ? "playlist" : res.resourceType;
            let coverColor = "black",
              coverColor2 = "black";
            const url = `/detail/${typeLink}?id=${res.resourceId}`;

            if (cover) {
              try {
                const v = new Vibrant(cover);
                const palette = await v.getPalette();
                coverColor = palette.LightVibrant?.hex || "black";
                coverColor2 = palette.DarkMuted?.hex || "black";
              } catch (error) {
                console.error("Failed to extract color", error);
              }
            }

            return {
              image: cover,
              title: res.title,
              subtitle: res.tag,
              handle: res.playOrUpdateTime,
              borderColor: coverColor,
              gradient: `linear-gradient(180deg, ${coverColor}, ${coverColor2})`,
              url: url,
              onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                if (res?.resourceId)
                  playList(res?.resourceId, res.resourceType);
              },

              resourceType: res.resourceType,
              id: res.resourceId,
            };
          }),
      );

      if (isMounted) {
        setItems(processedItems);
      }
    };

    loadItems();

    return () => {
      isMounted = false;
    };
  }, [resources]);

  useEffect(() => {
    updateScrollState();

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [items]);

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          <div className="flex items-center gap-2 group transform transition duration-300 ease-in-out">
            最近常听
          </div>
        </h2>

        {hasOverflow && (
          <div className="flex gap-2 items-center">
            <YeeButton
              variant="ghost"
              icon={<CaretLeft24Filled className="size-3" />}
              className="size-6 rounded-full bg-card border! border-border! text-muted-foreground hover:text-muted-foreground"
              onClick={() => scrollToPage(-1)}
              disabled={!canScrollPrev}
            />
            <YeeButton
              variant="ghost"
              icon={<CaretRight24Filled className="size-3" />}
              className="size-6 rounded-full bg-card border! border-border! text-muted-foreground hover:text-muted-foreground"
              onClick={() => scrollToPage(1)}
              disabled={!canScrollNext}
            />
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="w-full overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <ChromaGrid
          items={items}
          radius={300}
          damping={0.45}
          fadeOut={0.6}
          ease="power3.out"
        />
      </div>
    </section>
  );
}
