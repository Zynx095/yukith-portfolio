import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["opsz", "SOFT"], display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", weight: ["400", "500"], display: "swap" });

const description =
  "Yukith M Joseph — Computer Science & Engineering (Networks) student at Presidency University, Bengaluru. Security systems, applied AI and hardware, archived inside an ancient World Tree.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.yukithjoseph.me"),
  title: "Yukith M Joseph — The World Tree",
  description,
  openGraph: { title: "Yukith M Joseph — The World Tree", description, type: "website" },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-dark-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = { themeColor: "#0f0d0b", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body>
        {children}
        {/* Vercel Web Analytics only exists on Vercel deployments. */}
        {process.env.VERCEL && <Analytics />}
      </body>
    </html>
  );
}
