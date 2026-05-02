import { useEffect } from "react";

export function useDisableTab() {
  useEffect(() => {
    const disableTab = (e: KeyboardEvent) => {
      if (e.key === "tab") e.preventDefault();
    };
    window.addEventListener("keydown", disableTab, true);
    return () => window.removeEventListener("keydown", disableTab, true);
  }, []);
}
