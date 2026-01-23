'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

const NAV_ITEMS = [
  { href: '/connections', label: 'Connections', icon: 'connections' },
  { href: '/', label: 'Capture', icon: 'capture' },
  { href: '/library', label: 'Stash', icon: 'stash' },
];

const Icons = {
  capture: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  stash: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  connections: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
};

export default function BottomNav() {
  const pathname = usePathname();
  const { pendingCount } = useOfflineQueue();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
      <div className="flex justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-gray-900'
                  : 'text-gray-500'
              }`}
            >
              {Icons[item.icon as keyof typeof Icons]}
              <span>{item.label}</span>
              {item.icon === 'capture' && pendingCount > 0 && (
                <span className="absolute right-1/4 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
