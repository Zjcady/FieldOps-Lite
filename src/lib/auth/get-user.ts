import { createClient } from "@/lib/supabase/server";
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

/**
 * Get the currently authenticated user from Supabase session + Prisma.
 * Returns null if not authenticated or user not found in database.
 */
export async function getUser(): Promise<AppUser | null> {
  // If Supabase is not configured, fall back to first user (dev mode only)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const devUser = await prisma.user.findFirst({
      select: { id: true, authId: true, companyId: true, email: true, name: true, role: true, avatarUrl: true, phone: true },
      orderBy: { createdAt: "asc" },
    });
    if (devUser) return { ...devUser, authId: devUser.authId ?? "dev" } as AppUser;
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const user = await prisma.user.findUnique({
    where: { authId: authUser.id },
    select: {
      id: true,
      authId: true,
      companyId: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      phone: true,
      isActive: true,
    },
  });

  // #16: Reject deactivated users
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
