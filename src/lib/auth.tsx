import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Papel = "cliente" | "barbeiro" | "admin";

type AuthValue = {
  session: Session | null;
  userId: string | undefined;
  loading: boolean;
  papel: Papel | undefined;
  isAdmin: boolean;
  isBarbeiro: boolean;
  perfil: { id: string; nome: string; email: string | null; telefone: string | null; bloqueado: boolean } | null;
  barbeiroId: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_OUT") queryClient.clear();
    });
    supabase.auth.getSession().then(({ data: { session: current } }) => {
      setSession(current);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  const userId = session?.user?.id;

  const { data: perfil = null } = useQuery({
    queryKey: ["perfil", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, email, telefone, bloqueado")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: papel } = useQuery({
    queryKey: ["papel", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId!);
      if (error) throw error;
      const roles = (data ?? []).map((r) => r.role as Papel);
      if (roles.includes("admin")) return "admin" as Papel;
      if (roles.includes("barbeiro")) return "barbeiro" as Papel;
      return "cliente" as Papel;
    },
  });

  const { data: barbeiroId = null } = useQuery({
    queryKey: ["meu-barbeiro", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbeiros")
        .select("id")
        .eq("profile_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
  });

  const value = useMemo<AuthValue>(
    () => ({
      session,
      userId,
      loading,
      papel,
      isAdmin: papel === "admin",
      isBarbeiro: papel === "barbeiro" || !!barbeiroId,
      perfil,
      barbeiroId,
      signOut: async () => {
        await queryClient.cancelQueries();
        queryClient.clear();
        await supabase.auth.signOut();
      },
    }),
    [session, userId, loading, papel, perfil, barbeiroId, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
