"use client";

import React, { useState, useRef } from "react";
import {
	UploadCloud,
	FileText,
	FileSpreadsheet,
	FileCode,
	Image as ImageIcon,
	File,
	Trash2,
	AlertCircle,
} from "lucide-react";
import {
	validateSupportingFile,
	formatFileSize,
	getFileExtension,
} from "@/lib/reuse-documents";

export interface SupportingDocumentUploadProps {
	file: File | null;
	onFileChange: (file: File | null) => void;
	disabled?: boolean;
	className?: string;
}

export function getFileCategoryIcon(filename: string) {
	const ext = getFileExtension(filename);
	if (ext === "pdf") {
		return {
			icon: <FileText className="w-5 h-5 text-red-600" aria-hidden="true" />,
			bg: "bg-red-50 border-red-100",
			label: "PDF",
		};
	}
	if (["docx", "doc"].includes(ext)) {
		return {
			icon: <FileText className="w-5 h-5 text-blue-600" aria-hidden="true" />,
			bg: "bg-blue-50 border-blue-100",
			label: "DOCX",
		};
	}
	if (["xlsx", "xls"].includes(ext)) {
		return {
			icon: <FileSpreadsheet className="w-5 h-5 text-emerald-600" aria-hidden="true" />,
			bg: "bg-emerald-50 border-emerald-100",
			label: "EXCEL",
		};
	}
	if (ext === "dwg") {
		return {
			icon: <FileCode className="w-5 h-5 text-amber-600" aria-hidden="true" />,
			bg: "bg-amber-50 border-amber-100",
			label: "DWG",
		};
	}
	if (["jpg", "jpeg", "png"].includes(ext)) {
		return {
			icon: <ImageIcon className="w-5 h-5 text-indigo-600" aria-hidden="true" />,
			bg: "bg-indigo-50 border-indigo-100",
			label: "GAMBAR",
		};
	}
	return {
		icon: <File className="w-5 h-5 text-gray-500" aria-hidden="true" />,
		bg: "bg-gray-50 border-gray-200",
		label: "DOKUMEN",
	};
}

export default function SupportingDocumentUpload({
	file,
	onFileChange,
	disabled = false,
	className = "",
}: SupportingDocumentUploadProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = (selectedFile: File) => {
		setError(null);
		const validation = validateSupportingFile(selectedFile);
		if (!validation.valid) {
			setError(validation.error || "Berkas tidak valid.");
			if (inputRef.current) inputRef.current.value = "";
			return;
		}
		onFileChange(selectedFile);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (disabled) return;
		setIsDragging(true);
	};

	const handleDragEnter = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (disabled) return;
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
		if (disabled) return;

		const droppedFile = e.dataTransfer.files?.[0];
		if (droppedFile) {
			handleFileSelect(droppedFile);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const chosen = e.target.files?.[0];
		if (chosen) {
			handleFileSelect(chosen);
		}
	};

	const handleRemove = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setError(null);
		onFileChange(null);
		if (inputRef.current) inputRef.current.value = "";
	};

	const meta = file ? getFileCategoryIcon(file.name) : null;

	return (
		<div className={`space-y-1.5 ${className}`}>
			{/* AC 1: Label & Badge Opsional */}
			<div className="flex items-center gap-2">
				<label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
					Dokumen Pendukung / Justifikasi Kebutuhan
				</label>
				<span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-normal normal-case bg-gray-100 text-gray-600 border border-gray-200">
					(Opsional)
				</span>
			</div>

			{/* Hidden file input */}
			<input
				ref={inputRef}
				type="file"
				accept=".pdf,.docx,.doc,.xlsx,.xls,.dwg,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,image/jpeg,image/png"
				onChange={handleInputChange}
				disabled={disabled}
				className="hidden"
				aria-label="Pilih dokumen pendukung"
			/>

			{/* File Upload Interaction: Drag-and-Drop / Browse OR Preview Card */}
			{!file ? (
				<div
					onDragOver={handleDragOver}
					onDragEnter={handleDragEnter}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					onClick={() => {
						if (!disabled) inputRef.current?.click();
					}}
					role="button"
					tabIndex={0}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							if (!disabled) inputRef.current?.click();
						}
					}}
					className={`border-2 border-dashed rounded-lg p-3 sm:p-4 text-center transition-colors cursor-pointer select-none ${
						isDragging
							? "border-[#0A356A] bg-blue-50/60 ring-2 ring-[#0A356A]/20"
							: "border-gray-300 hover:border-[#0A356A]/50 bg-gray-50/50 hover:bg-gray-50"
					} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
				>
					<UploadCloud className="w-6 h-6 text-gray-400 mx-auto mb-1.5" />
					<div className="text-xs text-gray-600">
						<span className="font-medium text-gray-700">Tarik & lepas file di sini, atau </span>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								if (!disabled) inputRef.current?.click();
							}}
							disabled={disabled}
							className="font-bold text-[#0A356A] hover:underline focus:outline-none"
						>
							Browse File
						</button>
					</div>
				</div>
			) : (
				/* AC 2: Kartu Pratinjau Berkas */
				<div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-2xs">
					<div className="flex items-center gap-3 min-w-0 pr-2">
						{/* Ikon format dokumen */}
						<div
							className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
								meta?.bg || "bg-gray-50 border-gray-200"
							}`}
						>
							{meta?.icon}
						</div>
						{/* Nama file dan ukuran file dalam format yang mudah dibaca */}
						<div className="min-w-0">
							<p
								className="text-xs font-bold text-gray-800 truncate"
								title={`${file.name} (${formatFileSize(file.size)})`}
							>
								{file.name}{" "}
								<span className="font-normal text-gray-500">
									({formatFileSize(file.size)})
								</span>
							</p>
							<p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
								{meta?.label || "DOKUMEN"} • Siap Dilampirkan
							</p>
						</div>
					</div>

					{/* Tombol hapus / batalkan (ikon tempat sampah / silang) */}
					<button
						type="button"
						onClick={handleRemove}
						disabled={disabled}
						aria-label="Hapus berkas terpilih"
						title="Hapus berkas"
						className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
					>
						<Trash2 className="w-4 h-4" />
					</button>
				</div>
			)}

			{/* Pesan Error Validasi */}
			{error && (
				<div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 animate-in fade-in duration-150">
					<AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
					<span>{error}</span>
				</div>
			)}

			{/* AC 1: Hint Text */}
			<p className="text-[11px] text-gray-500 leading-snug">
				Format yang didukung: PDF, DOCX, XLSX, DWG, JPG/PNG (Maks. 25 MB)
			</p>
		</div>
	);
}
