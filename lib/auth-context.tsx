"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { signOut } from "@/app/auth/actions";

export interface AuthUser {
  id: string; // auth user id (claim `sub`)
  name: string; // user_metadata.username en mayúsculas, listo para UI
}

interface AuthContextValue {
  user: AuthUser | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// The server is the source of truth: auth Server Actions revalidate the layout,
// which re-renders this provider with a fresh `initialUser`.
export function AuthProvider({
  initialUser,
  children,
}: {
  initialUser: AuthUser | null;
  children: ReactNode;
}) {
  const value = useMemo<AuthContextValue>(
    () => ({ user: initialUser, logout: () => signOut() }),
    [initialUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
