import type { Metadata } from "next";
import { Inter, Space_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-space-mono" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Yukith M Joseph | The World Tree",
  description:
    "Network security, applied AI, games and websites by Yukith M Joseph — explore them as relics inside a golden World Tree, then read the full portfolio.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-dark-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable} ${playfair.variable}`}>
      <body className="overflow-x-hidden bg-[#0D0A08] text-[#F4F1EA] antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
