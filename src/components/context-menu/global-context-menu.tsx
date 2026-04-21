import { useContextMenuStore } from "@/lib/store/contextMenuStore";
import React, { useEffect, useRef, useState } from "react";
import { SongActions } from "./actions/song-actions";
import { AlbumActions } from "./actions/album-actions";
import { PlaylistActions } from "./actions/playlist-actions";

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

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menuWidth = menuRef.current.offsetWidth;
      const menuHeight = menuRef.current.offsetHeight;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const left = x + menuWidth > windowWidth ? x - menuWidth : x;
      const top = y + menuHeight > windowHeight ? y - menuHeight : y;

      setPosition({ left, top });
    }
  }, [isOpen, x, y]);

  useEffect(() => {
    if (!isOpen) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setActiveSubmenuId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      id="global-context-menu"
      className="fixed w-48 z-9999 pointer-events-auto bg-card/80 backdrop-blur-md border border-border rounded-lg shadow-lg flex flex-col p-2"
      style={{
        top: position.top,
        left: position.left,
        visibility: position.top === 0 ? "hidden" : "visible",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <MenuRegistrationContext.Provider
        value={{ activeSubmenuId, setActiveSubmenuId, timeoutRef }}
      >
        <SongActions type={type!} data={data} />
        <AlbumActions type={type!} data={data} />
        <PlaylistActions type={type!} data={data} />
      </MenuRegistrationContext.Provider>
    </div>
  );
}
