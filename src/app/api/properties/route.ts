import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireWrite, parseBody } from "@/lib/api-utils";

export async function GET() {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const properties = await prisma.property.findMany({
    where: { companyId: user.companyId },
    include: {
      customer: { select: { name: true } },
      _count: { select: { jobs: true } },
    },
    orderBy: { address: "asc" },
  });

  return NextResponse.json(properties);
}

export async function POST(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const [body, parseErr] = await parseBody<{
    address: string;
    city: string;
    state: string;
    zip?: string;
    customerId: string;
    notes?: string;
  }>(request);
  if (parseErr) return parseErr;

  if (!body.address || !body.city || !body.state || !body.customerId) {
    return apiError("address, city, state, and customerId are required", 400);
  }

  // Verify customerId belongs to this company
  const customer = await prisma.customer.findUnique({
    where: { id: body.customerId, companyId: user.companyId },
    select: { id: true },
  });
  if (!customer) return apiError("Customer not found", 404);

  const property = await prisma.property.create({
    data: {
      companyId: user.companyId,
      customerId: body.customerId,
      address: body.address,
      city: body.city,
      state: body.state,
      zip: body.zip || "",
      notes: body.notes || null,
    },
    include: {
      customer: { select: { name: true } },
      _count: { select: { jobs: true } },
    },
  });

  return NextResponse.json(property, { status: 201 });
}
