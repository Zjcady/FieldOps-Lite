import { NextRequest, NextResponse } from "next/server";
import { DEV_AUTH_COOKIE } from "@/lib/auth/get-user";
import prisma from "@/lib/prisma";

/**
 * POST /api/auth/dev-login
 * Dev mode only: sets a cookie to track which user is "logged in".
 * In production (Supabase configured), this endpoint is a no-op.
 */
export async function POST(request: NextRequest) {
  // Only works when Supabase is NOT configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ message: "Production mode — use Supabase auth" });
  }

  const { authId, email } = await request.json();

  if (!authId && !email) {
    return NextResponse.json({ error: "authId or email required" }, { status: 400 });
  }

  // Find the user by authId or email
  const user = authId
    ? await prisma.user.findUnique({ where: { authId }, select: { authId: true, name: true, email: true } })
    : await prisma.user.findFirst({ where: { email }, select: { authId: true, name: true, email: true } });

  if (!user || !user.authId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const response = NextResponse.json({ success: true, name: user.name, email: user.email });

  // Set the dev auth cookie
  response.cookies.set(DEV_AUTH_COOKIE, user.authId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}

/**
 * DELETE /api/auth/dev-login
 * Dev mode: clear the dev auth cookie (sign out).
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(DEV_AUTH_COOKIE);
  return response;
}
