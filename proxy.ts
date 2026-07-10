import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const ALLOWED_ORIGINS = ['https://stash.zitti.ro', 'https://zitti.ro', 'https://www.zitti.ro'];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost')) return true;
  return false;
}

function setCorsHeaders(response: NextResponse, origin: string) {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-gemini-api-key',
  );
  response.headers.set('Access-Control-Max-Age', '86400');
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');

  if (pathname.startsWith('/api/')) {
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      if (isAllowedOrigin(origin)) setCorsHeaders(response, origin!);
      return response;
    }

    const response = await updateSession(request);
    if (isAllowedOrigin(origin)) setCorsHeaders(response, origin!);
    return response;
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|offline.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
