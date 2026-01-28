import { useContainerWidth } from "@/hooks/useContainrWidth";
import {
  ArrowClockwise24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
} from "@fluentui/react-icons";
import React, { ReactNode, useState, useMemo } from "react";

interface SectionProps {
  title: string;
  children: ReactNode;
  seeMore?: boolean;
  refresh?: boolean;
  itemsPerPage?: number;
  itemWidth?: number; // 卡片宽度，默认 144px (w-36)
}

const GAP = 56; // gap-14 = 56px
const DEFAULT_ITEM_WIDTH = 144; // w-36 = 144px

export function Section({
  title,
  children,
  seeMore,
  refresh,
  itemsPerPage,
  itemWidth = DEFAULT_ITEM_WIDTH,
}: SectionProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const { ref, width } = useContainerWidth();

  // 计算每页显示的 items 数量
  const itemPerView = useMemo(() => {
    if (itemsPerPage) return itemsPerPage;
    if (width === 0) return 4; // 默认值

    // n * itemWidth + (n-1) * gap <= containerWidth
    // n <= (containerWidth + gap) / (itemWidth + gap)
    const count = Math.floor((width + GAP) / (itemWidth + GAP));
    return count > 0 ? count : 1;
  }, [width, itemsPerPage, itemWidth]);

  const items = React.Children.toArray(children);
  const totalPages = Math.ceil(items.length / itemPerView);

  // 确保 currentPage 不会越界
  const safeCurrentPage = currentPage >= totalPages ? 0 : currentPage;

  const handlePrev = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  // 构建分页数据
  const pages = useMemo(() => {
    const result = [];
    for (let i = 0; i < totalPages; i++) {
      result.push(items.slice(i * itemPerView, (i + 1) * itemPerView));
    }
    return result;
  }, [items, itemPerView, totalPages]);

  const needPage = totalPages > 1;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          <div
            className={`flex items-center gap-2 group transition-colors ${
              seeMore
                ? "cursor-pointer hover:bg-gray-100 rounded-md px-2 py-1 -ml-2 -mt-1 transform transition-all duration-300 ease-in-out"
                : ""
            }`}
          >
            {title}
            {seeMore && (
              <ChevronRight24Regular className="size-5 text-gray-500 group-hover:text-gray-700 group-hover:translate-x-2 group-hover:mr-1 transform transition duration-300 ease-in-out" />
            )}
          </div>
        </h2>

        <div className="flex gap-2 text-gray-500 items-center">
          {needPage && (
            <>
              <ChevronLeft24Regular
                className="size-5 hover:text-gray-700 cursor-pointer"
                onClick={handlePrev}
              />
              <ChevronRight24Regular
                className="size-5 hover:text-gray-700 cursor-pointer"
                onClick={handleNext}
              />
            </>
          )}
          {refresh && (
            <ArrowClockwise24Regular className="size-5 hover:text-gray-700 cursor-pointer" />
          )}
        </div>
      </div>

      <div className="w-full relative" ref={ref}>
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${safeCurrentPage * 100}%)`,
            }}
          >
            {pages.map((pageItems, idx) => (
              <div
                key={idx}
                className="flex gap-14 shrink-0"
                style={{ width: "100%" }}
              >
                {pageItems}
              </div>
            ))}
          </div>
        </div>
        {/* 右边遮罩层，盖住溢出的阴影 */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-white to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
