import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
const SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

export function getBrowserClient(): SupabaseClient {
  if (!SUPABASE_URL || !ANON_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 필요합니다.');
  }
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'sourcing-auth' },
  });
}

export function getAdminClient(): SupabaseClient {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.');
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type ProfileStatus = 'pending' | 'approved' | 'rejected';
export type ProfileRole = 'user' | 'admin';

export interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  status: ProfileStatus;
  role: ProfileRole;
  created_at: string;
  approved_at: string | null;
  expires_at: string | null;
}
