"use client";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ department, children }: { department: string; children: React.ReactNode }) {
  const { department: loggedIn } = useAuth();
  const router = useRouter();
  const allowed = loggedIn === department || loggedIn === "council";

  useEffect(() => { if (!allowed) router.replace("/restricted"); }, [allowed, router]);
  if (!allowed) return null;
  return <>{children}</>;
}