import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireWrite } from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id, companyId: user.companyId },
  });

  if (!customer) return apiError("Customer not found", 404);

  const portalToken = crypto.randomUUID();

  await prisma.customer.update({
    where: { id, companyId: user.companyId },
    data: { portalToken },
  });

  return NextResponse.json({ portalToken });
}
