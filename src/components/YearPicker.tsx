"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, X } from "lucide-react";

interface YearPickerProps {
	value?: string | number;
	onChange: (year: string) => void;
	startYear?: number;
	endYear?: number;
	placeholder?: string;
	disabled?: boolean;
	clearable?: boolean;
}

export default function YearPicker({
	value,
	onChange,
	startYear = 1950,
	endYear = new Date().getFullYear(),
	placeholder = "Pilih tahun",
	disabled = false,
	clearable = true,
}: YearPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const selectedRef = useRef<HTMLButtonElement>(null);

	const years = useMemo(
		() => Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i),
		[startYear, endYear],
	);

	// Tutup saat klik di luar / tekan Escape
	useEffect(() => {
		if (!isOpen) return;
		function onPointerDown(event: MouseEvent) {
			if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false);
		}
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") setIsOpen(false);
		}
		document.addEventListener("mousedown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("mousedown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [isOpen]);

	// Scroll ke tahun terpilih saat dibuka
	useEffect(() => {
		if (isOpen) selectedRef.current?.scrollIntoView({ block: "center" });
	}, [isOpen]);

	const selected = value ? String(value) : "";

	return (
		<div className="relative" ref={wrapperRef}>
			<button
				type="button"
				disabled={disabled}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				onClick={() => setIsOpen((prev) => !prev)}
				className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left border rounded outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400 ${
					isOpen
						? "border-[#0556B3] ring-1 ring-[#0556B3]"
						: "border-gray-300 hover:border-gray-400"
				}`}
			>
				<Calendar className="w-4 h-4 shrink-0 text-gray-400" />
				<span className={selected ? "text-gray-900" : "text-gray-400"}>
					{selected || placeholder}
				</span>
				{clearable && selected && !disabled && (
					<span
						role="button"
						tabIndex={0}
						aria-label="Hapus tahun"
						onClick={(e) => {
							e.stopPropagation();
							onChange("");
							setIsOpen(false);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								e.stopPropagation();
								onChange("");
							}
						}}
						className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
					>
						<X className="w-3.5 h-3.5" />
					</span>
				)}
			</button>

			{isOpen && (
				<div
					role="listbox"
					className="absolute z-30 mt-1 w-full min-w-[220px] bg-white border border-gray-200 rounded shadow-lg p-2"
				>
					<div className="max-h-56 overflow-y-auto grid grid-cols-3 gap-1.5 pr-1">
						{years.map((year) => {
							const isActive = selected === String(year);
							return (
								<button
									key={year}
									ref={isActive ? selectedRef : undefined}
									type="button"
									role="option"
									aria-selected={isActive}
									onClick={() => {
										onChange(String(year));
										setIsOpen(false);
									}}
									className={`py-1.5 text-xs font-medium rounded transition-colors ${
										isActive
											? "bg-[#0556B3] text-white"
											: "text-gray-700 hover:bg-blue-50 hover:text-[#0556B3]"
									}`}
								>
									{year}
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
