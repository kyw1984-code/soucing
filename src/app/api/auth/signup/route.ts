import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: '이메일, 비밀번호, 이름은 필수입니다.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다.' }, { status: 400 });
    }

    const admin = getAdminClient();

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone: phone || null },
    });

    if (createErr || !created.user) {
      const msg = createErr?.message || '계정 생성 실패';
      const isDup = /already|registered|exists/i.test(msg);
      return NextResponse.json(
        { error: isDup ? '이미 가입된 이메일입니다.' : msg },
        { status: isDup ? 409 : 500 },
      );
    }

    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const isAdmin = adminEmail && email.trim().toLowerCase() === adminEmail;

    // 자동 승인 설정 조회 (관리자가 토글로 변경 가능)
    let autoApproveSetting = false;
    try {
      const { data: setting } = await admin
        .from('system_settings')
        .select('value')
        .eq('key', 'auto_approve_signups')
        .maybeSingle();
      autoApproveSetting = setting?.value === 'true';
    } catch {
      // 설정 테이블이 없으면 false로 처리 (기존 동작 유지)
    }

    const approve = isAdmin || autoApproveSetting;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { error: profileErr } = await admin.from('profiles').insert({
      id: created.user.id,
      email,
      name,
      phone: phone || null,
      status: approve ? 'approved' : 'pending',
      role: isAdmin ? 'admin' : 'user',
      approved_at: approve ? now.toISOString() : null,
      expires_at: isAdmin ? null : expiresAt.toISOString(),
    });

    if (profileErr) {
      // 프로필 생성 실패 시 auth 사용자도 롤백
      await admin.auth.admin.deleteUser(created.user.id);
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      autoApproved: approve,
      message: isAdmin
        ? '관리자 계정으로 가입되어 자동 승인되었습니다.'
        : approve
          ? '가입이 완료되었습니다. 바로 로그인 가능합니다.'
          : '가입 신청이 접수되었습니다. 관리자 승인 후 로그인 가능합니다.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '서버 오류' }, { status: 500 });
  }
}
