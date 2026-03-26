import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireAdmin, parseBody, withErrorHandler } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { resend } from "@/lib/resend";

const VALID_ROLES = new Set(["crew_member", "crew_leader", "dispatcher", "ops_manager"]);

export const GET = withErrorHandler(async function GET(_request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const users = await prisma.user.findMany({
    where: { companyId: user.companyId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      avatarUrl: true,
      phone: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
});

export const POST = withErrorHandler(async function POST(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  const [body, parseErr] = await parseBody<{
    name: string;
    email: string;
    role?: string;
  }>(request);
  if (parseErr) return parseErr;

  if (!body.name || !body.email) {
    return apiError("name and email are required", 400);
  }

  const existing = await prisma.user.findUnique({
    where: { email: body.email },
  });
  if (existing) {
    return apiError("Email already in use", 409);
  }

  // Create Supabase auth user if Supabase is configured
  let authId: string | null = null;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createAdminClient();
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: body.email,
        email_confirm: true,
      });
      if (authError) {
        return apiError(`Failed to create auth account: ${authError.message}`, 500);
      }
      authId = authUser.user.id;
    } catch {
      return apiError("Failed to create auth account", 500);
    }
  }

  const newUser = await prisma.user.create({
    data: {
      companyId: user.companyId,
      name: body.name,
      email: body.email,
      role: body.role && VALID_ROLES.has(body.role) ? body.role : "crew_member",
      isActive: true,
      authId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      avatarUrl: true,
      phone: true,
    },
  });

  // Send invite email via Resend (non-blocking)
  if (resend) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const company = await prisma.company.findUnique({ where: { id: user.companyId }, select: { name: true } });
    resend.emails.send({
      from: "FieldOps <onboarding@resend.dev>",
      to: body.email,
      subject: `You've been invited to ${company?.name || "FieldOps"}`,
      html: `<p>Hi ${body.name},</p>
<p>You've been invited to join <strong>${company?.name || "FieldOps"}</strong> as a ${body.role || "crew member"}.</p>
<p>Sign in using the magic link option on the login page with your email address:</p>
<p><a href="${appUrl}/login">${appUrl}/login</a></p>
<p>— The FieldOps Team</p>`,
    }).catch(() => { /* non-blocking */ });
  }

  return NextResponse.json(newUser, { status: 201 });
});
