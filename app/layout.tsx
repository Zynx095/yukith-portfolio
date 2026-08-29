import type { Metadata } from 'next';
import { Inter, Space_Mono, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceMono = Space_Mono({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-space-mono' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'Yukith M Joseph | Cinematic Portfolio',
  description: 'Cybersecurity Analyst, Full-stack Developer, and Leader. Explore my interactive cinematic portfolio.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable} ${spaceMono.variable} ${playfair.variable}`}>
      <body className="bg-[#0D0A08] text-[#F4F1EA] antialiased overflow-x-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
