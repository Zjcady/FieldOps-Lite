import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Simple in-memory rate limiter (same pattern as portal route)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // requests per window (stricter for password reset)

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim()?.toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Verify the email exists in our database
  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true },
  });

  // Always return success to prevent email enumeration attacks
  // even if the user doesn't exist
  if (!user) {
    return NextResponse.json({ success: true });
  }

  // TODO: In production, call Supabase's resetPasswordForEmail:
  // const supabase = createAdminClient();
  // await supabase.auth.resetPasswordForEmail(email, {
  //   redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
  // });

  return NextResponse.json({ success: true });
}
