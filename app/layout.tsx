import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { VIEW_BOOT_SCRIPT } from "@/lib/view-boot";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["opsz", "SOFT"], display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", weight: ["400", "500"], display: "swap" });

const description =
  "Yukith M Joseph — Computer Science & Engineering (Networks) student at Presidency University, Bengaluru. Security systems, applied AI and hardware, archived inside an ancient World Tree — or read as a classic portfolio.";

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
    // data-view: the server always renders Classic (the no-JavaScript page); the boot
    // script switches to the visitor's mode before the first paint (lib/view.ts).
    <html lang="en" data-view="classic" suppressHydrationWarning className={`${fraunces.variable} ${inter.variable} ${jetbrains.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: VIEW_BOOT_SCRIPT }} />
      </head>
      <body>
        {children}
        {/* Vercel Web Analytics only exists on Vercel deployments. */}
        {process.env.VERCEL && <Analytics />}
      </body>
    </html>
  );
}
