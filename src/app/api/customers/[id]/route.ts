import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      properties: true,
      jobs: {
        select: { id: true, title: true, status: true, jobNumber: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) return apiError("Customer not found", 404);

  return NextResponse.json(customer);
}
