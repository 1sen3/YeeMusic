import {
  ArrowClockwise24Regular,
  ChevronRight24Regular,
} from "@fluentui/react-icons";
import { ReactNode } from "react";

interface SectionProps {
  title: string;
  children: ReactNode;
  seeMore?: boolean;
  refresh?: boolean;
}

export function Section({ title, children, seeMore, refresh }: SectionProps) {
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

        {refresh && (
          <ArrowClockwise24Regular className="size-5 text-gray-500 hover:text-gray-700 cursor-pointer" />
        )}
      </div>
      <div className="flex gap-8 overflow-x-auto pb-2 scrollbar-hide">
        {children}
      </div>
    </section>
  );
}
