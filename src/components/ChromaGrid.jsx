import { useRef } from "react";
import "./ChromaGrid.css";
import { Link } from "react-router-dom";
import { Play24Filled } from "@fluentui/react-icons";
import { useContextMenuStore } from "../lib/store/contextMenuStore/contextMenuStore";

export const ChromaGrid = ({
  items,
  className = "",
  columns = 3,
  rows = 2,
}) => {
  const rootRef = useRef(null);
  const openMenu = useContextMenuStore((s) => s.openMenu);

  const handleMove = (e) => {
    if (!rootRef.current) return;

    const cards = rootRef.current.querySelectorAll(".chroma-card");
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });
  };

  return (
    <div
      ref={rootRef}
      className={`chroma-grid ${className}`}
      style={{
        "--cols": columns,
        "--rows": rows,
      }}
      onPointerMove={handleMove}
    >
      {items.map((c, i) => (
        <Link
          to={c.url}
          key={i}
          onContextMenu={(e) => {
            e.preventDefault();
            openMenu(e.clientX, e.clientY, "resource", c);
          }}
        >
          <article
            className="chroma-card"
            style={{
              "--card-border": c.borderColor || "transparent",
              "--card-gradient": c.gradient,
              cursor: c.url ? "pointer" : "default",
            }}
          >
            <div
              className="chroma-img-wrapper group overflow-hidden"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (c.onClick) {
                  c.onClick(e);
                }
              }}
            >
              <img
                src={c.image}
                alt={c.title}
                loading="lazy"
                className="group-hover:brightness-80 transition-all duration-300 ease-in-out"
              />
              <Play24Filled className="text-white absolute left-1/2 top-1/2 -translate-1/2 size-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out" />
            </div>
            <footer className="flex flex-col items-center py-2">
              <h3 className="line-clamp-1 text-white text-sm w-5/7 text-center">
                {c.title}
              </h3>
              <p className="text-white/60 text-sm">{c.subtitle}</p>
            </footer>
          </article>
        </Link>
      ))}
    </div>
  );
};

export default ChromaGrid;
