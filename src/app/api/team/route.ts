import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireAdmin, parseBody } from "@/lib/api-utils";

export async function GET() {
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
}

export async function POST(request: NextRequest) {
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

  const newUser = await prisma.user.create({
    data: {
      companyId: user.companyId,
      name: body.name,
      email: body.email,
      role: body.role || "crew_member",
      isActive: true,
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

  return NextResponse.json(newUser, { status: 201 });
}
