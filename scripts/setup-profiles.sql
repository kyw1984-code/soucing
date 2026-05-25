-- 회원가입/승인 시스템을 위한 profiles 테이블
-- Supabase SQL Editor에서 1회 실행

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  phone text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  expires_at timestamptz
);

-- 기존 테이블에 컬럼이 없다면 추가 (재실행 안전)
alter table public.profiles add column if not exists expires_at timestamptz;

create index if not exists profiles_status_idx on public.profiles(status);
create index if not exists profiles_created_at_idx on public.profiles(created_at desc);
create index if not exists profiles_expires_at_idx on public.profiles(expires_at);

-- 이미 가입한 사용자에게 기본 만료일(가입일 + 7일) 적용 (관리자 제외)
update public.profiles
set expires_at = created_at + interval '7 days'
where expires_at is null and role <> 'admin';

-- RLS는 사용하지 않음(서비스 롤 키로 API에서 직접 접근).

-- 관리자 계정으로 만들고 싶은 사용자는 가입 후 아래로 승격:
-- update public.profiles set role='admin', status='approved', approved_at=now(), expires_at=null where email='관리자@example.com';
