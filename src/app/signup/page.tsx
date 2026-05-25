"use client";

import React, { useState } from "react";
import Link from "next/link";
import { UserPlus, Loader2, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "가입 실패");
        return;
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "네트워크 오류");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="w-full max-w-md bg-white rounded-[32px] p-10 border border-slate-200 shadow-xl text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-3">가입 신청 완료</h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-8">
            가입 신청이 정상적으로 접수되었습니다.<br />
            <span className="font-bold text-slate-800">관리자 승인 후</span> 로그인이 가능합니다.
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all"
          >
            로그인 페이지로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white rounded-[32px] p-10 border border-slate-200 shadow-xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">회원가입</h1>
            <p className="text-xs text-slate-500 font-bold">훈프로 소싱 파인더</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="이름" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-indigo-500/20"
            />
          </Field>

          <Field label="이메일" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-indigo-500/20"
            />
          </Field>

          <Field label="연락처">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-1234-5678"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-indigo-500/20"
            />
          </Field>

          <Field label="비밀번호 (6자 이상)" required>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-indigo-500/20"
            />
          </Field>

          <Field label="비밀번호 확인" required>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 ring-indigo-500/20"
            />
          </Field>

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
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "가입 신청"}
          </button>

          <p className="text-center text-xs text-slate-500 mt-2">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-black text-indigo-600 hover:underline">
              로그인
            </Link>
          </p>
        </form>

        <div className="mt-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold text-amber-700 leading-relaxed">
          가입 후 <span className="font-black">관리자 승인</span>이 완료되어야 서비스를 이용할 수 있습니다.
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
