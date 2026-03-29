import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const pathParts = requestUrl.pathname.split('/');
  
  let imageUrl = '';
  
  // URL 경로에서 base64 파라미터 추출 (/api/proxy-image/[BASE64]/image.jpg)
  const proxyIdx = pathParts.indexOf('proxy-image');
  if (proxyIdx !== -1 && pathParts.length > proxyIdx + 1) {
    const b64 = pathParts[proxyIdx + 1];
    try {
      const decoded = Buffer.from(b64, 'base64').toString('utf-8');
      if (decoded.startsWith('http')) {
        imageUrl = decoded;
      }
    } catch(e) {}
  }

  // 쿼리 매개변수로 URL 확인 (Fallback)
  if (!imageUrl) {
    imageUrl = requestUrl.searchParams.get('url') || '';
  }

  if (!imageUrl || !imageUrl.startsWith('http')) {
    return new NextResponse('Missing or invalid url parameter', { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Referer': 'https://www.coupang.com/',
        'Accept': 'image/jpeg,image/png,image/webp,image/*,*/*;q=0.8',
      },
      // cache: 'force-cache'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image from origin. Status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const blob = await response.blob();
    
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('[Proxy Image Error]', error.message);
    return new NextResponse('Error fetching image for proxy', { status: 500 });
  }
}
