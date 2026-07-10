import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { AuthProvider } from '@/lib/auth/auth-context';
import { ToastProvider } from '@/contexts/ToastContext';
import { NotionConnectionsProvider } from '@/contexts/NotionConnectionsContext';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://stash.zitti.ro'),
  title: {
    default: 'z-stash',
    template: '%s · z-stash',
  },
  description:
    'Turn screenshots, links, and voice notes into an AI-enriched personal knowledge stash.',
  manifest: '/manifest.json',
  applicationName: 'z-stash',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    title: 'z-stash',
    description: 'A mobile-first capture inbox for screenshots, links, and voice notes.',
    url: '/',
    siteName: 'z-stash',
    type: 'website',
    images: [
      {
        url: '/og.jpg',
        width: 1280,
        height: 720,
        alt: 'z-stash capture screen',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'z-stash',
    description: 'A mobile-first capture inbox for screenshots, links, and voice notes.',
    images: ['/og.jpg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'z-stash',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#111827',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <AuthProvider>
          <NotionConnectionsProvider>
            <ToastProvider>
              <Header />
              <main className="mx-auto max-w-5xl px-4 py-8 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-8">
                {children}
              </main>
              <BottomNav />
              <ServiceWorkerRegistration />
            </ToastProvider>
          </NotionConnectionsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
