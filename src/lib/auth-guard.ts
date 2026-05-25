import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from './supabase';

export async function requireAdmin(request: NextRequest) {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!adminEmail) {
    return { error: NextResponse.json({ error: 'ADMIN_EMAIL 환경변수가 설정되어 있지 않습니다.' }, { status: 500 }) };
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return { error: NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 }) };
  }

  const admin = getAdminClient();
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) {
    return { error: NextResponse.json({ error: '유효하지 않은 세션입니다.' }, { status: 401 }) };
  }

  const email = (userData.user.email || '').trim().toLowerCase();
  if (email !== adminEmail) {
    return { error: NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 }) };
  }

  return { admin, userId: userData.user.id };
}
