'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from './UserMenu';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-gray-900">
            z-stash
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-6 sm:flex">
              <Link
                href="/"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/'
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Capture
              </Link>
              <Link
                href="/library"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/library' || pathname.startsWith('/library')
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Discoveries
              </Link>
              <Link
                href="/notes"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/notes' || pathname.startsWith('/notes')
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Notes
              </Link>
              <Link
                href="/archive"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/archive' || pathname.startsWith('/archive')
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Archive
              </Link>
            </div>
            <UserMenu />
          </div>
        </nav>
      </div>
    </header>
  );
}
