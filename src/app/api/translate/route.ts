import { NextRequest, NextResponse } from 'next/server';

// 한국어 → 중국어 번역 (Google Translate 비공식 API)
export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get('text') || '';
  if (!text) return NextResponse.json({ translated: '' });

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    const translated: string = data?.[0]?.[0]?.[0] || '';
    return NextResponse.json({ translated });
  } catch {
    return NextResponse.json({ translated: '' });
  }
}
