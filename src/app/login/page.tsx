"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Loader2, TrendingUp } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = getBrowserClient();
      const { data, error: signErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signErr || !data.user) {
        setError(signErr?.message?.includes("Invalid") ? "이메일 또는 비밀번호가 올바르지 않습니다." : signErr?.message || "로그인 실패");
        return;
      }

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", data.user.id)
        .single();

      if (profileErr || !profile) {
        await supabase.auth.signOut();
        setError("프로필을 찾을 수 없습니다. 관리자에게 문의하세요.");
        return;
      }

      if (profile.status === "pending") {
        await supabase.auth.signOut();
        setError("관리자 승인 대기 중입니다. 승인 후 다시 로그인해 주세요.");
        return;
      }
      if (profile.status === "rejected") {
        await supabase.auth.signOut();
        setError("가입이 거절된 계정입니다. 관리자에게 문의하세요.");
        return;
      }

      router.push("/");
    } catch (err: any) {
      setError(err?.message || "네트워크 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white rounded-[32px] p-10 border border-slate-200 shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">
              훈프로 <span className="text-indigo-600">소싱 파인더</span>
            </h1>
            <p className="text-xs text-slate-500 font-bold">로그인</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">이메일</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-indigo-500/20"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-indigo-500/20"
            />
          </label>

          {error && (
            <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (<><LogIn className="w-4 h-4" /> 로그인</>)}
          </button>

          <p className="text-center text-xs text-slate-500 mt-2">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="font-black text-indigo-600 hover:underline">
              회원가입
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
