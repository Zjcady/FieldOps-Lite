import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export type AppUser = {
  id: string;
  authId: string;
  companyId: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  phone: string | null;
};

const USER_SELECT = {
  id: true, authId: true, companyId: true, email: true,
  name: true, role: true, avatarUrl: true, phone: true, isActive: true,
} as const;

/**
 * Dev mode cookie name — stores the authId of the currently "logged in" dev user.
 */
export const DEV_AUTH_COOKIE = "fieldops_dev_auth";

/**
 * Get the currently authenticated user from Supabase session + Prisma.
 * In dev mode (no Supabase env vars), uses a cookie to track which user is active.
 * Returns null if not authenticated or user not found in database.
 */
export async function getUser(): Promise<AppUser | null> {
  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSupabaseConfigured) {
    // Dev mode: use cookie to identify active user
    const cookieStore = await cookies();
    const devAuthId = cookieStore.get(DEV_AUTH_COOKIE)?.value;

    // Dev mode requires explicit login via /api/auth/dev-login — no auto-login
    if (!devAuthId) return null;

    const devUser = await prisma.user.findUnique({
      where: { authId: devAuthId },
      select: USER_SELECT,
    });

    if (!devUser || !devUser.isActive) return null;
    return { ...devUser, authId: devUser.authId ?? "dev" } as AppUser;
  }

  // Production: Supabase auth
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const user = await prisma.user.findUnique({
    where: { authId: authUser.id },
    select: USER_SELECT,
  });

  if (!user || !user.authId || !user.isActive) return null;

  return user as AppUser;
}

/**
 * Get the user or throw — use in API routes where auth is required.
 */
export async function requireUser(): Promise<AppUser> {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
