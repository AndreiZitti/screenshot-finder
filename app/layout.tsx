import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'z-stash',
  description: 'Capture knowledge and ideas from screenshots and voice notes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:pb-8">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
