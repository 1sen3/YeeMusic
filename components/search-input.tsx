"use client";

import { Search24Regular } from "@fluentui/react-icons";
import { Input } from "./ui/input";
import { useEffect, useState } from "react";
import { getSearchDefault, getSearchSuggest } from "@/lib/services/search";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "next/navigation";

export function SearchInput() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [placeholder, setPlaceholder] = useState("搜索...");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();

  useEffect(() => {
    async function fetchDefault() {
      try {
        const res = await getSearchDefault();
        if (res?.showKeyword) setPlaceholder(res.showKeyword);
      } catch (err) {
        console.error("获取默认搜索词失败", err);
      }
    }
    fetchDefault();
  }, []);

  useEffect(() => {
    if (!debouncedQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([]);
      return;
    }

    async function fetchSuggest() {
      try {
        const res = await getSearchSuggest(debouncedQuery);
        setSuggestions(res);
      } catch (err) {
        console.error("获取搜索建议失败", err);
      }
    }
    fetchSuggest();
  }, [debouncedQuery]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(-1);
  }, [suggestions]);

  function handleSearch(keyword: string) {
    if (!keyword.trim() && !placeholder.trim()) return;
    setQuery(keyword);
    setSuggestions([]);
    setIsOpen(false);
    router.push(
      `/search?q=${encodeURIComponent(keyword ? keyword : placeholder)}`,
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions.length > 0)
        handleSearch(suggestions[selectedIndex]);
      else handleSearch(query);
      return;
    }

    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + suggestions.length) % suggestions.length,
        );
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  }

  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        className="w-64 bg-white pl-8 rounded-full border-0 drop-shadow-md focus:border-0 focus:ring-0!"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 0)}
        onKeyDown={handleKeyDown}
      />

      <Search24Regular
        className="text-black/60 hover:text-black/80 size-4 cursor-pointer absolute left-2 top-1/2 -translate-y-1/2"
        onClick={() => handleSearch(query)}
      />

      <div
        className={cn(
          "opacity-0 absolute top-full left-0 bg-white px-2 py-2 w-full mt-4 shadow-md rounded-3xl flex flex-col gap-2  transition-opacity ease-in-out duration-300",
          isOpen && suggestions.length > 0 && "opacity-100",
        )}
      >
        {suggestions.map((suggest, index) => (
          <div
            key={suggest}
            className={cn(
              "hover:bg-black/5 w-full px-4 py-2 rounded-full cursor-pointer",
              index === selectedIndex && "bg-black/5",
            )}
            onClick={() => {
              handleSearch(suggest);
            }}
          >
            <span className="line-clamp-1 text-sm">{suggest}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
