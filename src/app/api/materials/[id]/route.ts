import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, requireWrite, parseBody, apiError } from "@/lib/api-utils";
import { MATERIAL_STATUSES } from "@/lib/constants";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const { id } = await params;

  const [body, parseErr] = await parseBody<{
    status?: string;
    deliveryDate?: string;
  }>(request as never);
  if (parseErr) return parseErr;

  // Verify material belongs to company
  const existing = await prisma.material.findFirst({
    where: { id, job: { companyId: user.companyId } },
  });
  if (!existing) return apiError("Material not found", 404);

  if (body.status && !(MATERIAL_STATUSES as readonly string[]).includes(body.status)) {
    return apiError(`Invalid status. Must be one of: ${MATERIAL_STATUSES.join(", ")}`, 400);
  }

  const data: Record<string, unknown> = {};

  if (body.status) {
    data.status = body.status;
    if (body.status === "ordered") {
      data.orderedDate = new Date();
    }
    if (body.status === "delivered") {
      data.deliveryDate = body.deliveryDate ? new Date(body.deliveryDate) : new Date();
    }
  }

  if (body.deliveryDate && !body.status) {
    data.deliveryDate = new Date(body.deliveryDate);
  }

  // Use existing.id to prevent TOCTOU — re-verify ownership inline
  const updated = await prisma.material.update({
    where: { id: existing.id },
    data,
    include: {
      job: { select: { title: true, jobNumber: true } },
      vendor: { select: { name: true } },
    },
  });

  return NextResponse.json(updated);
}
