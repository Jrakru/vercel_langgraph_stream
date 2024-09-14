import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AI } from "./action";

// Import Inter font
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "vercel_rsc",
	description: "testing vercel_rsc capabilities",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<AI>
			<html lang="en" className="light">
				<body className={cn("min-h-screen font-sans antialiased", inter.className)}>
					{children}
				</body>
			</html>
		</AI>
	);
}
