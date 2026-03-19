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

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.paidDate && { paidDate: new Date(body.paidDate) }),
    },
    include: { job: { select: { title: true, jobNumber: true } } },
  });

  return NextResponse.json(updated);
}
