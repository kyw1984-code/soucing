import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(request);
  if ('error' in guard) return guard.error;

  const body = await request.json();
  const ids: unknown = body?.ids;
  const days = Number(body?.days);

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: '연장할 사용자 ID 목록이 비어있습니다.' }, { status: 400 });
  }
  if (!Number.isFinite(days) || days <= 0 || days > 3650) {
    return NextResponse.json({ error: '연장 일수가 올바르지 않습니다.(1~3650)' }, { status: 400 });
  }

  // 현재 expires_at을 읽어서, 이미 만료되었으면 오늘 기준으로 연장
  const { data: rows, error: readErr } = await guard.admin
    .from('profiles')
    .select('id, expires_at, role')
    .in('id', ids as string[]);

  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });

  const nowMs = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // 관리자 계정은 만료 없음 → 건드리지 않음
  const updates = (rows || [])
    .filter((r) => r.role !== 'admin')
    .map((r) => {
      const baseMs = r.expires_at ? new Date(r.expires_at).getTime() : nowMs;
      const startMs = Math.max(baseMs, nowMs);
      const newExp = new Date(startMs + days * dayMs).toISOString();
      return { id: r.id, expires_at: newExp };
    });

  if (updates.length === 0) {
    return NextResponse.json({ ok: true, count: 0, skipped: rows?.length || 0 });
  }

  // 행 단위 update (관리자 행은 위에서 제외됨)
  const results = await Promise.all(
    updates.map((u) =>
      guard.admin.from('profiles').update({ expires_at: u.expires_at }).eq('id', u.id),
    ),
  );
  const firstErr = results.find((r) => r.error)?.error;
  if (firstErr) return NextResponse.json({ error: firstErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, count: updates.length, days });
}
