import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if ('error' in guard) return guard.error;

  const { ids } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: '승인할 사용자 ID 목록이 비어있습니다.' }, { status: 400 });
  }

  const { data, error } = await guard.admin
    .from('profiles')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .in('id', ids)
    .select('id');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, count: data?.length || 0 });
}
