"use client";

import React, {
	useState,
	useRef,
	useEffect,
	useMemo,
	useCallback,
} from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";

export interface SelectOption {
	id?: string | number;
	value?: string | number;
	name?: string;
	label?: string;
	code?: string;
	description?: string;
	[key: string]: unknown;
}

interface SearchableSelectProps {
	options: SelectOption[];
	value?: string | number;
	onChange: (value: string) => void;
	onBlur?: () => void;
	placeholder?: string;
	searchPlaceholder?: string;
	name?: string;
	disabled?: boolean;
	hasError?: boolean;
	clearable?: boolean;
	className?: string;
	emptyMessage?: string;
}

export default function SearchableSelect({
	options = [],
	value = "",
	onChange,
	onBlur,
	placeholder = "Pilih opsi...",
	searchPlaceholder = "Ketik untuk mencari...",
	name,
	disabled = false,
	hasError = false,
	clearable = true,
	className = "",
	emptyMessage = "Tidak ada data yang cocok.",
}: SearchableSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

	const containerRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	// Normalize options
	const normalizedOptions = useMemo(() => {
		return options.map((opt) => {
			const optValue = String(opt.id ?? opt.value ?? "");
			const optLabel = opt.name ?? opt.label ?? optValue;
			return {
				value: optValue,
				label: optLabel,
				code: opt.code,
				description: opt.description,
				raw: opt,
			};
		});
	}, [options]);

	// Filter options based on search query
	const filteredOptions = useMemo(() => {
		if (!searchQuery.trim()) return normalizedOptions;
		const query = searchQuery.toLowerCase().trim();
		return normalizedOptions.filter((opt) => {
			const labelMatch = opt.label.toLowerCase().includes(query);
			const codeMatch = opt.code ? opt.code.toLowerCase().includes(query) : false;
			const descMatch = opt.description
				? opt.description.toLowerCase().includes(query)
				: false;
			return labelMatch || codeMatch || descMatch;
		});
	}, [normalizedOptions, searchQuery]);

	// Current selected option
	const selectedOption = useMemo(() => {
		const strVal = String(value ?? "");
		if (!strVal) return null;
		return normalizedOptions.find((opt) => opt.value === strVal) || null;
	}, [normalizedOptions, value]);

	// Handle close
	const handleClose = useCallback(() => {
		setIsOpen(false);
		setSearchQuery("");
		setHighlightedIndex(-1);
		if (onBlur) onBlur();
	}, [onBlur]);

	// Handle select
	const handleSelect = (val: string) => {
		onChange(val);
		handleClose();
	};

	// Handle clear
	const handleClear = (e: React.MouseEvent) => {
		e.stopPropagation();
		onChange("");
		setSearchQuery("");
		if (onBlur) onBlur();
	};

	// Close on click outside or escape
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				handleClose();
			}
		};

		const handleKeyDownGlobal = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				handleClose();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleKeyDownGlobal);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDownGlobal);
		};
	}, [isOpen, handleClose]);

	// Auto-focus search input when opened
	useEffect(() => {
		if (isOpen) {
			setTimeout(() => {
				searchInputRef.current?.focus();
			}, 30);
		}
	}, [isOpen]);

	// Keyboard navigation in list
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) {
			if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
				e.preventDefault();
				setIsOpen(true);
			}
			return;
		}

		if (e.key === "ArrowDown") {
			e.preventDefault();
			setHighlightedIndex((prev) =>
				prev < filteredOptions.length - 1 ? prev + 1 : 0,
			);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setHighlightedIndex((prev) =>
				prev > 0 ? prev - 1 : filteredOptions.length - 1,
			);
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (
				highlightedIndex >= 0 &&
				highlightedIndex < filteredOptions.length
			) {
				handleSelect(filteredOptions[highlightedIndex].value);
			} else if (filteredOptions.length === 1) {
				handleSelect(filteredOptions[0].value);
			}
		}
	};

	// Scroll highlighted into view
	useEffect(() => {
		if (highlightedIndex >= 0 && listRef.current) {
			const itemEl = listRef.current.children[highlightedIndex] as HTMLElement;
			if (itemEl) {
				itemEl.scrollIntoView({ block: "nearest" });
			}
		}
	}, [highlightedIndex]);

	// Helper to highlight matching text
	const renderHighlightedText = (text: string, query: string) => {
		if (!query.trim()) return text;
		const q = query.trim();
		const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
		const parts = text.split(regex);
		return (
			<>
				{parts.map((part, i) =>
					regex.test(part) ? (
						<span
							key={i}
							className="bg-yellow-200 text-gray-900 font-semibold rounded-xs px-0.5"
						>
							{part}
						</span>
					) : (
						<span key={i}>{part}</span>
					),
				)}
			</>
		);
	};

	return (
		<div
			ref={containerRef}
			className={`relative w-full ${className}`}
			onKeyDown={handleKeyDown}
		>
			{/* Hidden input for form tracking / accessibility */}
			{name && <input type="hidden" name={name} value={value ?? ""} />}

			{/* Main Trigger Button */}
			<div
				tabIndex={disabled ? -1 : 0}
				role="combobox"
				aria-expanded={isOpen}
				aria-haspopup="listbox"
				aria-disabled={disabled}
				onClick={() => {
					if (!disabled) setIsOpen((prev) => !prev);
				}}
				className={`w-full px-3 py-2 text-sm border rounded outline-none transition-all flex items-center justify-between cursor-pointer select-none bg-white ${
					disabled
						? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
						: hasError
							? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10 text-gray-900"
							: isOpen
								? "border-[#0556B3] ring-1 ring-[#0556B3] text-gray-900"
								: "border-gray-300 hover:border-gray-400 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]"
				}`}
			>
				<span
					className={`truncate flex-1 text-left ${
						selectedOption ? "text-gray-900 font-medium" : "text-gray-400"
					}`}
				>
					{selectedOption ? selectedOption.label : placeholder}
				</span>

				<div className="flex items-center gap-1.5 ml-2 shrink-0">
					{clearable && selectedOption && !disabled && (
						<button
							type="button"
							aria-label="Hapus pilihan"
							onClick={handleClear}
							className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded hover:bg-gray-100"
						>
							<X className="w-3.5 h-3.5" />
						</button>
					)}
					<ChevronDown
						className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
							isOpen ? "rotate-180 text-[#0556B3]" : ""
						}`}
					/>
				</div>
			</div>

			{/* Dropdown Popover */}
			{isOpen && (
				<div
					className="absolute left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 min-w-[200px]"
					style={{ top: "100%" }}
				>
					{/* Search Input Header */}
					<div className="p-2 border-b border-gray-100 bg-gray-50/70">
						<div className="relative flex items-center">
							<Search className="w-4 h-4 text-gray-400 absolute left-2.5 pointer-events-none" />
							<input
								ref={searchInputRef}
								type="text"
								value={searchQuery}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									setHighlightedIndex(0);
								}}
								placeholder={searchPlaceholder}
								className="w-full pl-8 pr-7 py-1.5 text-xs border border-gray-300 rounded bg-white outline-none focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3] text-gray-900 placeholder:text-gray-400 transition-all"
								onClick={(e) => e.stopPropagation()}
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										setSearchQuery("");
										searchInputRef.current?.focus();
									}}
									className="absolute right-2 text-gray-400 hover:text-gray-600 p-0.5 rounded"
								>
									<X className="w-3 h-3" />
								</button>
							)}
						</div>
					</div>

					{/* Options List */}
					<div
						ref={listRef}
						role="listbox"
						className="max-h-56 overflow-y-auto py-1 divide-y divide-gray-50"
					>
						{filteredOptions.length === 0 ? (
							<div className="px-4 py-4 text-xs text-center text-gray-500 flex flex-col items-center gap-1">
								<span>{emptyMessage}</span>
								{searchQuery && (
									<span className="text-[11px] text-gray-400">
										Tidak ada hasil untuk &ldquo;{searchQuery}&rdquo;
									</span>
								)}
							</div>
						) : (
							filteredOptions.map((opt, index) => {
								const isSelected = selectedOption?.value === opt.value;
								const isHighlighted = highlightedIndex === index;

								return (
									<div
										key={opt.value}
										role="option"
										aria-selected={isSelected}
										onClick={() => handleSelect(opt.value)}
										onMouseEnter={() => setHighlightedIndex(index)}
										className={`px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
											isSelected
												? "bg-blue-50/80 text-[#0556B3] font-semibold"
												: isHighlighted
													? "bg-gray-100 text-gray-900"
													: "text-gray-700 hover:bg-gray-50"
										}`}
									>
										<div className="flex flex-col flex-1 pr-2 overflow-hidden">
											<span className="truncate">
												{renderHighlightedText(opt.label, searchQuery)}
											</span>
											{opt.code && (
												<span className="text-[10px] text-gray-400 truncate">
													{renderHighlightedText(opt.code, searchQuery)}
												</span>
											)}
										</div>

										{isSelected && (
											<Check className="w-4 h-4 text-[#0556B3] shrink-0 ml-1" />
										)}
									</div>
								);
							})
						)}
					</div>

					{/* Footer showing count */}
					{filteredOptions.length > 0 && (
						<div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 text-[10px] text-gray-500 flex justify-between items-center">
							<span>
								{filteredOptions.length} opsi{" "}
								{searchQuery ? "ditemukan" : "tersedia"}
							</span>
							<span className="text-gray-400">Tekan Enter untuk memilih</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
