-- 시스템 설정 테이블 (key-value 단순 저장)
-- Supabase SQL Editor에서 1회 실행

create table if not exists public.system_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- 기본값: 자동 승인 OFF (관리자가 토글로 변경 가능)
insert into public.system_settings (key, value)
values ('auto_approve_signups', 'false')
on conflict (key) do nothing;
