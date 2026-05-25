"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2, CheckCheck, X, RefreshCw, LogOut, CheckCircle2, Clock, Ban, Home } from "lucide-react";
import { getBrowserClient, Profile, ProfileStatus } from "@/lib/supabase";

type Tab = ProfileStatus;

export default function AdminPage() {
  const router = useRouter();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>("pending");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      if (!session) {
        router.replace("/login");
        return;
      }
      const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").trim().toLowerCase();
      const email = (session.user.email || "").trim().toLowerCase();
      if (!adminEmail || email !== adminEmail) {
        router.replace("/");
        return;
      }
      setToken(session.access_token);
      setBootstrapping(false);
    });
  }, [router]);

  const fetchUsers = async (currentTab: Tab) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pending-users?status=${currentTab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "조회 실패");
        return;
      }
      setUsers(data.users || []);
      setSelected(new Set());
    } catch (e: any) {
      setError(e?.message || "네트워크 오류");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchUsers(tab);
  }, [token, tab]);

  const allChecked = users.length > 0 && selected.size === users.length;

  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(users.map((u) => u.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleBulk = async (action: "approve" | "reject") => {
    if (selected.size === 0 || !token) return;
    if (action === "reject" && !confirm(`${selected.size}명을 거절하시겠습니까?`)) return;
    setWorking(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "처리 실패");
        return;
      }
      await fetchUsers(tab);
    } catch (e: any) {
      setError(e?.message || "네트워크 오류");
    } finally {
      setWorking(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const tabMeta = useMemo(
    () => [
      { key: "pending" as Tab, label: "승인 대기", icon: Clock, color: "amber" },
      { key: "approved" as Tab, label: "승인 완료", icon: CheckCircle2, color: "emerald" },
      { key: "rejected" as Tab, label: "거절", icon: Ban, color: "rose" },
    ],
    [],
  );

  if (bootstrapping) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <Shield className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900">관리자 콘솔</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">User Approval</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-sm"
            >
              <Home className="w-3.5 h-3.5" />
              메인 페이지로
            </a>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-black text-slate-700 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              로그아웃
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit">
          {tabMeta.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                tab === t.key ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-black text-slate-900">
                {tabMeta.find((t) => t.key === tab)?.label}
                <span className="ml-2 text-slate-400 font-bold">({users.length}명)</span>
              </h2>
              {selected.size > 0 && (
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[11px] font-black rounded-full">
                  {selected.size}명 선택됨
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchUsers(tab)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[11px] font-black text-slate-700 transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                새로고침
              </button>
              {tab === "pending" && (
                <>
                  <button
                    onClick={() => handleBulk("reject")}
                    disabled={selected.size === 0 || working}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-[11px] font-black disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    선택 거절
                  </button>
                  <button
                    onClick={() => handleBulk("approve")}
                    disabled={selected.size === 0 || working}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-black disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    {working ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                    일괄 승인 ({selected.size})
                  </button>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="px-6 py-3 bg-rose-50 border-b border-rose-200 text-xs font-bold text-rose-600">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {tab === "pending" && (
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={toggleAll}
                        className="w-4 h-4 accent-indigo-600"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 text-left">이름</th>
                  <th className="px-4 py-3 text-left">이메일</th>
                  <th className="px-4 py-3 text-left">연락처</th>
                  <th className="px-4 py-3 text-left">가입일</th>
                  <th className="px-4 py-3 text-left">상태</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" />
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-sm font-bold text-slate-400">
                      해당 상태의 사용자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      {tab === "pending" && (
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selected.has(u.id)}
                            onChange={() => toggleOne(u.id)}
                            className="w-4 h-4 accent-indigo-600"
                          />
                        </td>
                      )}
                      <td className="px-4 py-4 font-black text-slate-900">{u.name}</td>
                      <td className="px-4 py-4 text-slate-600 font-bold">{u.email}</td>
                      <td className="px-4 py-4 text-slate-500 font-bold tabular-nums">{u.phone || "-"}</td>
                      <td className="px-4 py-4 text-slate-500 font-bold tabular-nums text-xs">
                        {new Date(u.created_at).toLocaleString("ko-KR")}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={u.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: ProfileStatus }) {
  if (status === "pending")
    return <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-md uppercase">대기</span>;
  if (status === "approved")
    return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-md uppercase">승인</span>;
  return <span className="px-2.5 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-md uppercase">거절</span>;
}
