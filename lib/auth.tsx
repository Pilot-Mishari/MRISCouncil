"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabaseBrowser } from "./supabase/client";

type AuthCtx = { department: string | null; loading: boolean; login: (u: string, p: string) => Promise<boolean>; logout: () => void };
const Ctx = createContext<AuthCtx | null>(null);
const supabase = supabaseBrowser();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [department, setDepartment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const resolve = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setDepartment(null); setLoading(false); return; }
    const { data } = await supabase.from("department_members").select("department_slug").eq("user_id", user.id).single();
    setDepartment(data?.department_slug ?? null);
    setLoading(false);
  };

  useEffect(() => {
    resolve();
    const { data: sub } = supabase.auth.onAuthStateChange(() => resolve());
    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async (u: string, p: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: `${u}@mris.internal`, password: p });
    return !error;
  };

  return <Ctx.Provider value={{ department, loading, login, logout: () => supabase.auth.signOut() }}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};