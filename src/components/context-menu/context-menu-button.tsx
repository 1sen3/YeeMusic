import { ChevronRight24Regular } from "@fluentui/react-icons";
import React, { useEffect, useRef, useState } from "react";
import { MenuRegistrationContext } from "./global-context-menu";

interface ContextMenuButtonProps {
  id: string;
  content?: string;
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  hasSubmenu?: boolean;
  children?: React.ReactNode;
}

export function ContextMenuSeperator() {
  return <div className="h-px bg-border my-2" />;
}

export function ContextMenuButton({
  id,
  content,
  icon,
  onClick,
  hasSubmenu,
  children,
}: ContextMenuButtonProps) {
  const { activeSubmenuId, setActiveSubmenuId, timeoutRef } = React.useContext(
    MenuRegistrationContext,
  );
  const subMenuRef = useRef<HTMLDivElement>(null);
  const [positionClass, setPositionClass] = useState("left-full pl-1");
  const [topOffset, setTopOffset] = useState("0px");

  const showSubmenu = activeSubmenuId === id;

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveSubmenuId(id);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveSubmenuId(null);
    }, 200);
  };

  useEffect(() => {
    if (showSubmenu && subMenuRef.current) {
      const rect = subMenuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newPositionClass = "left-full pl-4";
      let newTopOffset = "0px";

      if (rect.right > viewportWidth) {
        newPositionClass = "right-full pr-4";
      }

      if (rect.bottom > viewportHeight) {
        const diff = rect.bottom - viewportHeight + 8;
        newTopOffset = `-${diff}px`;
      }

      setPositionClass(newPositionClass);
      setTopOffset(newTopOffset);
    } else if (!showSubmenu) {
      setPositionClass("left-full pl-1");
      setTopOffset("0px");
    }
  }, [showSubmenu]);

  return (
    <div
      className="flex gap-2 p-2 items-center text-sm hover:bg-foreground/5 rounded-md cursor-pointer relative"
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="size flex items-center justify-center">{icon}</div>
      <span className="line-clamp-1">{content}</span>
      {hasSubmenu && (
        <ChevronRight24Regular className="size-4 ml-auto text-foreground/60" />
      )}

      {hasSubmenu && showSubmenu && children && (
        <div
          ref={subMenuRef}
          className={`absolute z-99999 cursor-default ${positionClass}`}
          style={{ top: topOffset }}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
        >
          <IsolatedSubmenu>
            <div className="w-48 bg-card border border-border rounded-lg shadow-lg flex flex-col p-2 max-h-[300px] overflow-y-auto">
              {children}
            </div>
          </IsolatedSubmenu>
        </div>
      )}
    </div>
  );
}

function IsolatedSubmenu({ children }: { children: React.ReactNode }) {
  const { timeoutRef } = React.useContext(MenuRegistrationContext);
  const [activeSubmenuId, setActiveSubmenuId] = useState<string | null>(null);
  return (
    <MenuRegistrationContext.Provider
      value={{ activeSubmenuId, setActiveSubmenuId, timeoutRef }}
    >
      {children}
    </MenuRegistrationContext.Provider>
  );
}
