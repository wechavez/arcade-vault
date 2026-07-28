"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export interface AuthUser {
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (name: string) => void;
  loginAsGuest: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: (name: string) => setUser({ name: name.toUpperCase().slice(0, 10) }),
      loginAsGuest: () => setUser(null),
      logout: () => setUser(null),
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
