import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireWrite, requireAdmin, validateBody, safeDate } from "@/lib/api-utils";
import { permitCreateSchema } from "@/lib/validations/job";

const permitUpdateSchema = permitCreateSchema.partial();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const [body, valErr] = await validateBody(request, permitUpdateSchema);
  if (valErr) return valErr;

  const { id } = await params;

  const existing = await prisma.permit.findUnique({ where: { id, companyId: user.companyId } });
  if (!existing) return apiError("Permit not found", 404);

  const permit = await prisma.permit.update({
    where: { id, companyId: user.companyId },
    data: {
      ...(body.permitNumber !== undefined && { permitNumber: body.permitNumber }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.jurisdiction !== undefined && { jurisdiction: body.jurisdiction }),
      ...(body.issuedDate !== undefined && { issuedDate: body.issuedDate ? safeDate(body.issuedDate) : null }),
      ...(body.expiryDate !== undefined && { expiryDate: body.expiryDate ? safeDate(body.expiryDate) : null }),
      ...(body.cost !== undefined && { cost: body.cost }),
      ...(body.notes !== undefined && { notes: body.notes }),
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
