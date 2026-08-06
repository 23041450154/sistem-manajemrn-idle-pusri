import type { Metadata } from "next";
import {
	Geist,
	Geist_Mono,
	IBM_Plex_Sans,
	IBM_Plex_Mono,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Manajemen Idle Equipment - PT Pusri ",
	description:
		"Platform terpusat untuk memonitor, mengelola, dan mengoptimalkan penggunaan peralatan yang sedang tidak beroperasi di PT PUSRI.",
	icons: {
		icon: "/pusri-2.png",
	},
};

import NextTopLoader from "nextjs-toploader";
import { cn } from "@/lib/utils";

// DESIGN.md typography row 31 "Financial Trust" — IBM Plex Sans.
// Chosen for true tabular figures (rupiah columns, equipment codes).
const plexSans = IBM_Plex_Sans({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-sans",
});

const plexMono = IBM_Plex_Mono({
	subsets: ["latin"],
	weight: ["400", "500"],
	variable: "--font-plex-mono",
});

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={cn(
				"h-full",
				"antialiased",
				geistSans.variable,
				geistMono.variable,
				"font-sans",
				plexSans.variable,
				plexMono.variable,
			)}
			suppressHydrationWarning
		>
			<body className="min-h-full flex flex-col" suppressHydrationWarning>
				<NextTopLoader
					color="#0556B3"
					height={4}
					showSpinner={false}
					shadow="0 0 10px #0556B3,0 0 5px #0556B3"
				/>
				{children}
			</body>
		</html>
	);
}
