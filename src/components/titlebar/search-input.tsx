import { useDebounce } from "@/hooks/use-debounce";
import { getSearchDefault, getSearchSuggest } from "@/lib/services/search";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { cn } from "@/lib/utils";
import { Search24Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../ui/input";

export function SearchInput() {
	const [query, setQuery] = useState("");
	const debouncedQuery = useDebounce(query, 300);
	const [placeholder, setPlaceholder] = useState("搜索...");
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const navigate = useNavigate();

	const user = useUserStore((s) => s.user);

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
	}, [user]);

	useEffect(() => {
		if (!debouncedQuery) {
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
		setSelectedIndex(-1);
	}, [suggestions]);

	function handleSearch(keyword: string) {
		if (!keyword.trim() && !placeholder.trim()) return;
		setQuery(keyword);
		setSuggestions([]);
		setIsOpen(false);
		navigate(
			`/search?q=${encodeURIComponent(keyword ? keyword : placeholder)}`,
		);
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter") {
			e.preventDefault();
			if (selectedIndex >= 0 && suggestions.length > 0) {
				handleSearch(suggestions[selectedIndex]);
			} else {
				handleSearch(query);
			}
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
				className={cn(
					"w-72 border-border/80 bg-card/80! pr-8 shadow-xs hover:bg-card/60! focus:border-border/80!",
					isOpen && suggestions.length > 0 && "rounded-b-none",
				)}
				containerClassName={cn(
					"rounded-md",
					isOpen && suggestions.length > 0 && "rounded-b-none",
				)}
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				onFocus={() => setIsOpen(true)}
				onBlur={() => setTimeout(() => setIsOpen(false), 0)}
				onKeyDown={handleKeyDown}
			/>

			<Search24Regular
				className="absolute top-1/2 right-2 size-4 -translate-y-1/2 text-foreground/60 hover:text-foreground/80"
				onClick={() => handleSearch(query)}
			/>

			<AnimatePresence>
				{isOpen && suggestions.length > 0 && (
					<motion.div
						className="absolute top-full left-0 w-full overflow-hidden rounded-b-md border-0 bg-card yee-drop-shadow"
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.2, ease: "easeInOut" }}
					>
						<div className="flex flex-col gap-2 px-2 py-2">
							{suggestions.map((suggest, index) => (
								<div
									key={suggest}
									className={cn(
										"relative w-full rounded-sm p-2 hover:bg-foreground/8",
										index === selectedIndex && "bg-foreground/5",
									)}
									onMouseDown={(e) => e.preventDefault()}
									onClick={() => {
										handleSearch(suggest);
									}}
								>
									<span className={cn("line-clamp-1 text-sm")}>{suggest}</span>
									{index === selectedIndex && (
										<div className="absolute top-1/2 left-0 h-4 w-1 -translate-y-1/2 -translate-x-0.5 rounded-full bg-primary" />
									)}
								</div>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
