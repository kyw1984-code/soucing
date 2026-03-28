import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = [
  'coupangcdn.com',
  'thumbnail.coupangcdn.com',
  'ads-partners.coupang.com',
  'img1a.coupangcdn.com',
  'img2a.coupangcdn.com',
  'img3a.coupangcdn.com',
  'img4a.coupangcdn.com',
  'img5a.coupangcdn.com',
  'img1c.coupangcdn.com',
  'img4c.coupangcdn.com',
  'img5c.coupangcdn.com',
  'image1.coupangcdn.com',
  'image3.coupangcdn.com',
  'image5.coupangcdn.com',
  'image6.coupangcdn.com',
  'image10.coupangcdn.com',
  'image13.coupangcdn.com',
  'image14.coupangcdn.com',
];

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return new NextResponse('url 파라미터가 필요합니다.', { status: 400 });
  }

  let parsedHost: string;
  try {
    parsedHost = new URL(url).hostname;
  } catch {
    return new NextResponse('잘못된 URL입니다.', { status: 400 });
  }

  const allowed = ALLOWED_HOSTS.some(h => parsedHost === h || parsedHost.endsWith('.' + h));
  if (!allowed) {
    return new NextResponse('허용되지 않은 이미지 도메인입니다.', { status: 403 });
  }

  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.coupang.com/',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      return new NextResponse(`이미지를 가져올 수 없습니다. (${res.status})`, { status: res.status });
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
    return new NextResponse(`프록시 오류: ${e.message}`, { status: 500 });
  }
}
