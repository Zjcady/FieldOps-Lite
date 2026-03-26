import { NextRequest, NextResponse } from "next/server";
import { DEV_AUTH_COOKIE } from "@/lib/auth/get-user";
import prisma from "@/lib/prisma";

/**
 * POST /api/auth/dev-login
 * Dev mode only: sets a cookie to track which user is "logged in".
 * In production (Supabase configured), this endpoint is a no-op.
 */
export async function POST(request: NextRequest) {
  // Hard guard: never allow dev-login in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only works when Supabase is NOT configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const res = NextResponse.json({ message: "Production mode — use Supabase auth" });
    res.headers.set("Cache-Control", "no-store, no-cache");
    return res;
  }

  const { authId, email } = await request.json();

  if (!authId && !email) {
    const errRes = NextResponse.json({ error: "authId or email required" }, { status: 400 });
    errRes.headers.set("Cache-Control", "no-store, no-cache");
    return errRes;
  }

  // Find the user by authId or email
  const user = authId
    ? await prisma.user.findUnique({ where: { authId }, select: { id: true, authId: true, name: true, email: true } })
    : await prisma.user.findFirst({ where: { email }, select: { id: true, authId: true, name: true, email: true } });

  if (!user) {
    const errRes = NextResponse.json({ error: "User not found" }, { status: 404 });
    errRes.headers.set("Cache-Control", "no-store, no-cache");
    return errRes;
  }

  // If user has no authId, assign a dev one so the cookie works
  let userAuthId = user.authId;
  if (!userAuthId) {
    userAuthId = `dev-${user.id}`;
    await prisma.user.update({ where: { id: user.id }, data: { authId: userAuthId } });
  }

  const response = NextResponse.json({ success: true, name: user.name, email: user.email });
  response.headers.set("Cache-Control", "no-store, no-cache");

  // Set the dev auth cookie
  response.cookies.set(DEV_AUTH_COOKIE, userAuthId, {
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
  // Hard guard: never allow dev-login in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const response = NextResponse.json({ success: true });
  response.headers.set("Cache-Control", "no-store, no-cache");
  response.cookies.delete(DEV_AUTH_COOKIE);
  return response;
}
