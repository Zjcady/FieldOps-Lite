import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireWrite, parseBody } from "@/lib/api-utils";

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
    paidDate?: string;
  }>(request);
  if (parseErr) return parseErr;

  const invoice = await prisma.invoice.findUnique({
    where: { id, companyId: user.companyId },
  });
  if (!invoice) return apiError("Invoice not found", 404);

  const VALID_STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"];
  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return apiError(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`, 400);
  }

  const updated = await prisma.invoice.update({
    where: { id, companyId: user.companyId },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.paidDate && { paidDate: new Date(body.paidDate) }),
    },
    include: { job: { select: { title: true, jobNumber: true } } },
  });

  return NextResponse.json(updated);
}
