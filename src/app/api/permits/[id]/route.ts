import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireWrite, requireAdmin, parseBody, safeDate } from "@/lib/api-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const [body, parseErr] = await parseBody(request);
  if (parseErr) return parseErr;

  const { id } = await params;

  const existing = await prisma.permit.findUnique({ where: { id, companyId: user.companyId } });
  if (!existing) return apiError("Permit not found", 404);

  const b = body as Record<string, unknown>;
  const permit = await prisma.permit.update({
    where: { id, companyId: user.companyId },
    data: {
      permitNumber: (b.permitNumber as string) ?? existing.permitNumber,
      type: (b.type as string) ?? existing.type,
      status: (b.status as string) ?? existing.status,
      jurisdiction: (b.jurisdiction as string) ?? existing.jurisdiction,
      issuedDate: b.issuedDate ? safeDate(b.issuedDate) : existing.issuedDate,
      expiryDate: b.expiryDate ? safeDate(b.expiryDate) : existing.expiryDate,
      cost: (b.cost as number) ?? existing.cost,
      notes: (b.notes as string) ?? existing.notes,
    },
    include: { job: { select: { title: true } } },
  });

  return NextResponse.json(permit);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  const { id } = await params;
  const existing = await prisma.permit.findUnique({ where: { id, companyId: user.companyId } });
  if (!existing) return apiError("Permit not found", 404);

  // Fix #5: Use companyId on the actual delete to prevent race condition
  await prisma.permit.delete({ where: { id, companyId: user.companyId } });
  return NextResponse.json({ success: true });
}
