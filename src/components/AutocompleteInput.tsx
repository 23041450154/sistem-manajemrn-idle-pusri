"use client";

import React, {
	useState,
	useRef,
	useEffect,
	useMemo,
	useCallback,
} from "react";
import { X, Check } from "lucide-react";

export interface AutocompleteOption {
	id?: string | number;
	value?: string | number;
	name?: string;
	label?: string;
	sublabel?: string;
	code?: string;
	description?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	raw?: any;
}

interface AutocompleteInputProps {
	mode?: "text" | "select";
	options?: AutocompleteOption[];
	value?: string | number;
	onChange: (value: string, option?: AutocompleteOption) => void;
	onBlur?: () => void;
	onFocus?: () => void;
	placeholder?: string;
	name?: string;
	maxLength?: number;
	minChars?: number;
	disabled?: boolean;
	hasError?: boolean;
	clearable?: boolean;
	className?: string;
	emptyMessage?: string;
	autoComplete?: string;
	/** Buka dropdown saat fokus meski belum mengetik (tampilkan semua opsi). */
	showOnFocus?: boolean;
}

export default function AutocompleteInput({
	mode = "select",
	options = [],
	value = "",
	onChange,
	onBlur,
	onFocus,
	placeholder = "Ketik untuk mencari...",
	name,
	maxLength,
	minChars = 1,
	disabled = false,
	hasError = false,
	clearable = true,
	className = "",
	emptyMessage = "Tidak ada saran yang cocok.",
	autoComplete = "off",
	showOnFocus = false,
}: AutocompleteInputProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [inputValue, setInputValue] = useState("");
	const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);

	// Normalize options
	const normalizedOptions = useMemo<AutocompleteOption[]>(() => {
		return options.map((opt) => {
			const optValue = String(opt.value ?? opt.id ?? "");
			const optLabel = String(opt.label ?? opt.name ?? optValue);
			return {
				...opt,
				id: opt.id ?? optValue,
				value: optValue,
				label: optLabel,
				sublabel: opt.sublabel ?? opt.description ?? opt.code,
			};
		});
	}, [options]);

	// Find option corresponding to current value
	const selectedOption = useMemo(() => {
		const strVal = String(value ?? "");
		if (!strVal) return null;
		if (mode === "select") {
			return (
				normalizedOptions.find(
					(opt) => String(opt.id) === strVal || opt.value === strVal,
				) || null
			);
		}
		return (
			normalizedOptions.find(
				(opt) => opt.value === strVal || opt.label === strVal,
			) || null
		);
	}, [normalizedOptions, value, mode]);

	// Synchronize input text with external value.
	// ponytail: pakai pattern "adjust state during render" (react.dev) — pengganti
	// useEffect+setState yang dilarang rule react-hooks/set-state-in-effect.
	const [lastSyncedValue, setLastSyncedValue] = useState<
		string | number | undefined
	>(value);
	if (value !== lastSyncedValue) {
		setLastSyncedValue(value);
		if (mode === "select") {
			setInputValue(selectedOption ? (selectedOption.label ?? "") : "");
		} else {
			setInputValue(String(value ?? ""));
		}
	}

	// Filter options based on typed input ONLY by label (name/tag), not description
	const filteredOptions = useMemo(() => {
		const query = inputValue.toLowerCase().trim();
		if (query.length < minChars) {
			// Belum mengetik + showOnFocus → tampilkan seluruh opsi (urut label).
			return showOnFocus ? normalizedOptions : [];
		}

		const matched = normalizedOptions.filter((opt) => {
			const label = (opt.label ?? "").toLowerCase();
			return label.includes(query);
		});

		// Sort so items starting with query come first
		return matched.sort((a, b) => {
			const aLabel = (a.label ?? "").toLowerCase();
			const bLabel = (b.label ?? "").toLowerCase();
			const aStarts = aLabel.startsWith(query);
			const bStarts = bLabel.startsWith(query);
			if (aStarts && !bStarts) return -1;
			if (!aStarts && bStarts) return 1;
			return aLabel.localeCompare(bLabel);
		});
	}, [normalizedOptions, inputValue, minChars, showOnFocus]);

	// Handle close
	const handleClose = useCallback(() => {
		setIsOpen(false);
		setHighlightedIndex(-1);

		if (mode === "select") {
			// If select mode, reset input to selected label if user typed something unselected
			if (selectedOption) {
				setInputValue(selectedOption.label ?? "");
			} else {
				setInputValue("");
			}
		}
		if (onBlur) onBlur();
	}, [mode, selectedOption, onBlur]);

	// Close on click outside
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

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen, handleClose]);

	// Handle item selection
	const handleSelectOption = (opt: AutocompleteOption) => {
		if (mode === "select") {
			const selectedVal = String(opt.id ?? opt.value ?? "");
			setInputValue(opt.label ?? "");
			onChange(selectedVal, opt);
		} else {
			const selectedVal = String(opt.value ?? opt.label ?? "");
			setInputValue(selectedVal);
			onChange(selectedVal, opt);
		}
		setIsOpen(false);
		setHighlightedIndex(-1);
	};

	// Handle input text changes
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const text = e.target.value;
		setInputValue(text);

		// Only open suggestions popup if user has typed something specific
		if (text.trim().length >= minChars) {
			setIsOpen(true);
			setHighlightedIndex(0);
		} else if (showOnFocus) {
			// Input dikosongkan → kembali tampilkan daftar lengkap.
			setIsOpen(true);
			setHighlightedIndex(0);
		} else {
			setIsOpen(false);
			setHighlightedIndex(-1);
		}

		if (mode === "text") {
			onChange(text);
		} else {
			// If user cleared the input
			if (!text.trim()) {
				onChange("");
				return;
			}
			// Check if typed text matches an option exactly
			const exactMatch = normalizedOptions.find(
				(opt) => (opt.label ?? "").toLowerCase() === text.toLowerCase().trim(),
			);
			if (exactMatch) {
				onChange(String(exactMatch.id ?? exactMatch.value ?? ""), exactMatch);
			} else {
				// Clear selection ID until an option is chosen
				onChange("");
			}
		}
	};

	// Clear input
	const handleClear = (e: React.MouseEvent) => {
		e.stopPropagation();
		setInputValue("");
		onChange("");
		setIsOpen(false);
		inputRef.current?.focus();
	};

	// Handle keyboard navigation
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "ArrowDown") {
			if (!isOpen && (inputValue.trim().length >= minChars || showOnFocus)) {
				e.preventDefault();
				setIsOpen(true);
				setHighlightedIndex(0);
				return;
			}
			if (isOpen && filteredOptions.length > 0) {
				e.preventDefault();
				setHighlightedIndex((prev) =>
					prev < filteredOptions.length - 1 ? prev + 1 : 0,
				);
			}
		} else if (e.key === "ArrowUp") {
			if (isOpen && filteredOptions.length > 0) {
				e.preventDefault();
				setHighlightedIndex((prev) =>
					prev > 0 ? prev - 1 : filteredOptions.length - 1,
				);
			}
		} else if (e.key === "Enter") {
			if (
				isOpen &&
				highlightedIndex >= 0 &&
				highlightedIndex < filteredOptions.length
			) {
				e.preventDefault();
				handleSelectOption(filteredOptions[highlightedIndex]);
			}
		} else if (e.key === "Escape") {
			e.preventDefault();
			handleClose();
		}
	};

	// Scroll highlighted option into view
	useEffect(() => {
		if (highlightedIndex >= 0 && listRef.current) {
			const itemEl = listRef.current.children[highlightedIndex] as HTMLElement;
			if (itemEl) {
				itemEl.scrollIntoView({ block: "nearest" });
			}
		}
	}, [highlightedIndex]);

	const showClear = clearable && !disabled && Boolean(inputValue);
	const shouldShowPopup =
		isOpen &&
		(inputValue.trim().length >= minChars || showOnFocus) &&
		normalizedOptions.length > 0;

	return (
		<div ref={containerRef} className={`relative w-full ${className}`}>
			<div className="relative flex items-center">
				<input
					ref={inputRef}
					type="text"
					name={name}
					value={inputValue}
					maxLength={maxLength}
					disabled={disabled}
					autoComplete={autoComplete}
					placeholder={placeholder}
					onChange={handleInputChange}
					onFocus={() => {
						if (showOnFocus && !disabled) setIsOpen(true);
						if (onFocus) onFocus();
					}}
					onKeyDown={handleKeyDown}
					className={`w-full px-3 py-2 text-sm border rounded outline-none transition-all ${
						showClear ? "pr-8" : "pr-3"
					} ${
						disabled
							? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
							: hasError
								? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10 text-gray-900"
								: "border-gray-300 text-gray-900 focus:border-[#0556B3] focus:ring-1 focus:ring-[#0556B3]"
					}`}
				/>

				{showClear && (
					<button
						type="button"
						aria-label="Hapus"
						onClick={handleClear}
						className="absolute right-2.5 text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded"
					>
						<X className="w-3.5 h-3.5" />
					</button>
				)}
			</div>

			{/* Dropdown Suggestions List (Only shows when user types specific keywords) */}
			{shouldShowPopup && (
				<div
					className="absolute left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 min-w-[200px]"
					style={{ top: "100%" }}
				>
					<div
						ref={listRef}
						role="listbox"
						className="max-h-56 overflow-y-auto py-1 divide-y divide-gray-50"
					>
						{filteredOptions.length === 0 ? (
							<div className="px-4 py-3 text-xs text-center text-gray-500">
								{emptyMessage}
							</div>
						) : (
							filteredOptions.map((opt, index) => {
								const isSelected =
									mode === "select"
										? String(value) === String(opt.id ?? opt.value)
										: String(value) === String(opt.value ?? opt.label);
								const isHighlighted = highlightedIndex === index;

								return (
									<div
										key={String(opt.id ?? opt.value ?? index)}
										role="option"
										aria-selected={isSelected}
										onMouseDown={(e) => {
											// Use onMouseDown to trigger before input onBlur
											e.preventDefault();
											handleSelectOption(opt);
										}}
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
											<span className="truncate font-medium text-gray-900">
												{opt.label}
											</span>
											{opt.sublabel && (
												<span className="text-[10px] text-gray-500 truncate mt-0.5">
													{opt.sublabel}
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

					{filteredOptions.length > 0 && (
						<div className="px-3 py-1 border-t border-gray-100 bg-gray-50 text-[10px] text-gray-400 flex justify-between items-center">
							<span>{filteredOptions.length} saran ditemukan</span>
							<span>Gunakan panah & Enter</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
