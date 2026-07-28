"use client";

import { useAuth } from "@/lib/auth-context";

export function PlayerName() {
  const { user } = useAuth();
  return <>{user ? user.name : "INVITADO"}</>;
}
