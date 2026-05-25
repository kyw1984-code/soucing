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
  approved_at timestamptz
);

create index if not exists profiles_status_idx on public.profiles(status);
create index if not exists profiles_created_at_idx on public.profiles(created_at desc);

-- RLS는 사용하지 않음(서비스 롤 키로 API에서 직접 접근).
-- 필요 시 아래 주석을 풀고 정책을 설정하세요.
-- alter table public.profiles enable row level security;

-- 관리자 계정으로 만들고 싶은 사용자는 가입 후 아래로 승격:
-- update public.profiles set role='admin', status='approved', approved_at=now() where email='관리자@example.com';
