'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-gray-900">
            Finder
          </Link>
          <div className="flex gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Upload
            </Link>
            <Link
              href="/library"
              className={`text-sm font-medium transition-colors ${
                pathname === '/library'
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Library
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
