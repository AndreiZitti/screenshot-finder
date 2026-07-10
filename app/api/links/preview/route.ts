import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/api-client';
import { isAccessControlEnforced } from '@/lib/auth/access-control';
import { LinkPlatform } from '@/types/link';

function detectPlatform(url: string): LinkPlatform {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube';
    if (hostname.includes('tiktok.com')) return 'tiktok';
    if (hostname.includes('instagram.com')) return 'instagram';
    if (hostname.includes('reddit.com')) return 'reddit';
    if (hostname.includes('x.com') || hostname.includes('twitter.com')) return 'x';
    return 'other';
  } catch {
    return 'other';
  }
}

function extractOgTag(html: string, property: string): string | null {
  // Match both property="" and content="" in either order
  const patterns = [
    new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await createClientFromRequest(request);
    if (!user && isAccessControlEnforced()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return NextResponse.json(
        { error: 'Only HTTP and HTTPS URLs are supported' },
        { status: 400 },
      );
    }

    const platform = detectPlatform(url);
    let name: string | null = null;
    let thumbnail: string | null = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkPreview/1.0)',
        },
      });

      clearTimeout(timeout);

      const html = await response.text();

      name = extractOgTag(html, 'og:title') || extractOgTag(html, 'og:site_name');
      thumbnail = extractOgTag(html, 'og:image');
    } catch {
      // Fetch failed or timed out - return partial data
    }

    return NextResponse.json({ name, thumbnail, platform });
  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json({ error: 'Failed to fetch preview' }, { status: 500 });
  }
}
