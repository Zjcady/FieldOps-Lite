import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireWrite, parseBody } from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const { id: crewId } = await params;

  const [body, parseErr] = await parseBody<{ userId: string; role?: string }>(request);
  if (parseErr) return parseErr;

  if (!body.userId) return apiError("userId is required", 400);

  const crew = await prisma.crew.findUnique({
    where: { id: crewId, companyId: user.companyId },
  });
  if (!crew) return apiError("Crew not found", 404);

  const member = await prisma.crewMember.create({
    data: {
      crewId,
      userId: body.userId,
      role: body.role || "member",
    },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return NextResponse.json(member, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const { id: crewId } = await params;

  const [body, parseErr] = await parseBody<{ userId: string }>(request);
  if (parseErr) return parseErr;

  if (!body.userId) return apiError("userId is required", 400);

  const crew = await prisma.crew.findUnique({
    where: { id: crewId, companyId: user.companyId },
  });
  if (!crew) return apiError("Crew not found", 404);

  await prisma.crewMember.delete({
    where: {
      crewId_userId: { crewId, userId: body.userId },
    },
  });

  return NextResponse.json({ success: true });
}
