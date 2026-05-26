import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';

// GET: 모든 시스템 설정 반환 (관리자 전용)
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if ('error' in guard) return guard.error;

  const { data, error } = await guard.admin
    .from('system_settings')
    .select('key, value');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const settings: Record<string, string> = {};
  for (const row of data || []) {
    settings[row.key] = row.value;
  }
  return NextResponse.json({ settings });
}

// POST: { key, value } — 시스템 설정 업데이트
export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if ('error' in guard) return guard.error;

  const body = await request.json();
  const key = String(body?.key || '').trim();
  const value = String(body?.value ?? '').trim();

  const ALLOWED_KEYS = new Set(['auto_approve_signups']);
  if (!ALLOWED_KEYS.has(key)) {
    return NextResponse.json({ error: '허용되지 않은 설정 키입니다.' }, { status: 400 });
  }

  const { error } = await guard.admin
    .from('system_settings')
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, key, value });
}
