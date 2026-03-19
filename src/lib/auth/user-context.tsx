"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AppUser } from "@/lib/auth/get-user";

const UserContext = createContext<AppUser | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: AppUser | null;
  children: ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser(): AppUser | null {
  return useContext(UserContext);
}
