import type { Metadata } from "next" 
import { Inter, Space_Mono, Playfair_Display } from "next/font/google" 
import { Analytics } from "@vercel/analytics/next" 
import { YukithRadio } from "@/components/YukithRadio"
import "./globals.css" 

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" }) 
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-space-mono", display: "swap" }) 
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" })

export const metadata: Metadata = {
  title: "Yukith M Joseph — Systems Engineer & Cybersecurity Researcher",
  description: "Portfolio of Yukith M Joseph. B.Tech CSE (Networks) student at Presidency University, Bengaluru. Building AI systems, cybersecurity architectures, and embedded intelligence.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceMono.variable} ${playfair.variable} font-sans bg-cream-100 text-wood-900 antialiased`}>
        {children}
        <YukithRadio />
        <Analytics />
      </body>
    </html>
  )
}
