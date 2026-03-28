import { NextRequest, NextResponse } from 'next/server';

/**
 * Base64url-path image proxy
 * URL: /api/img/BASE64URL_ENCODED_IMAGE_URL
 * - No ?url= query param (AiPrice compatible)
 * - Fetches Coupang CDN image from US Vercel servers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { b64: string } }
) {
  const b64 = params.b64;
  if (!b64) {
    return new NextResponse('Missing path', { status: 400 });
  }

  let imageUrl: string;
  try {
    imageUrl = Buffer.from(b64, 'base64url').toString('utf-8');
  } catch {
    return new NextResponse('Invalid base64', { status: 400 });
  }

  let parsedHost: string;
  try {
    parsedHost = new URL(imageUrl).hostname;
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  const allowed =
    parsedHost === 'coupangcdn.com' ||
    parsedHost.endsWith('.coupangcdn.com') ||
    parsedHost.endsWith('.coupang.com');

  if (!allowed) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const res = await fetch(imageUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.coupang.com/',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      return new NextResponse(`Failed: ${res.status}`, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: any) {
    return new NextResponse(`Proxy error: ${e.message}`, { status: 500 });
  }
}
