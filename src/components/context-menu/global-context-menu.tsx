import { useContextMenuStore } from "@/lib/store/contextMenuStore/contextMenuStore";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SongActions } from "./actions/song-actions";
import { AlbumActions } from "./actions/album-actions";
import { PlaylistActions } from "./actions/playlist-actions";
import { SongArtistInfoActions } from "./actions/song-artist-info-actions";
import { TextSelectionActions } from "./actions/text-selection-actions";

export const MenuRegistrationContext = React.createContext<{
  activeSubmenuId: string | null;
  setActiveSubmenuId: (id: string | null) => void;
  timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}>({
  activeSubmenuId: null,
  setActiveSubmenuId: () => {},
  timeoutRef: { current: null },
});

export function GlobalContextMenu() {
  const { isOpen, x, y, type, data, closeMenu } = useContextMenuStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const [activeSubmenuId, setActiveSubmenuId] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeMenu]);

  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menuWidth = menuRef.current.offsetWidth;
    const menuHeight = menuRef.current.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const viewportPadding = 8;

    const left =
      x + menuWidth + viewportPadding > windowWidth
        ? Math.max(viewportPadding, x - menuWidth)
        : Math.min(x, windowWidth - menuWidth - viewportPadding);
    const top =
      y + menuHeight + viewportPadding > windowHeight
        ? Math.max(viewportPadding, y - menuHeight)
        : Math.min(y, windowHeight - menuHeight - viewportPadding);

    setPosition({ left, top });
    setIsPositioned(true);
  }, [isOpen, x, y, type, data]);

  useEffect(() => {
    if (!isOpen) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setActiveSubmenuId(null);
      setIsPositioned(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      id="global-context-menu"
      className="yee-glass-surface yee-context-menu-surface fixed w-48 z-9999 pointer-events-auto rounded-lg flex flex-col p-2"
      style={{
        top: position.top,
        left: position.left,
        visibility: isPositioned ? "visible" : "hidden",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <MenuRegistrationContext.Provider
        value={{ activeSubmenuId, setActiveSubmenuId, timeoutRef }}
      >
        <SongActions type={type!} data={data} />
        <SongArtistInfoActions type={type!} data={data} />
        <AlbumActions type={type!} data={data} />
        <PlaylistActions type={type!} data={data} />
        <TextSelectionActions type={type!} data={data} />
      </MenuRegistrationContext.Provider>
    </div>
  );
}
