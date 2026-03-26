import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  if (!checkRateLimit("reset-password", ip, 10)) {
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

  // Send password reset email via Supabase (only when Supabase is configured)
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createAdminClient();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/auth/callback?next=/`,
      });
    } catch {
      // Silently fail — don't reveal whether the email send succeeded
    }
  }

  return NextResponse.json({ success: true });
}
