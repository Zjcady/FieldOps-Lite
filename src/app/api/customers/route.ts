import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, validateBody, getPagination } from "@/lib/api-utils";
import { customerCreateSchema } from "@/lib/validations/job";

export async function GET(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { skip, take } = getPagination(request);

  const customers = await prisma.customer.findMany({
    where: { companyId: user.companyId },
    include: {
      properties: true,
      _count: { select: { jobs: true } },
    },
    orderBy: { name: "asc" },
    skip,
    take,
  });
  return NextResponse.json(customers);
}

export async function POST(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const [body, valErr] = await validateBody(request, customerCreateSchema);
  if (valErr) return valErr;

  const customer = await prisma.customer.create({
    data: {
      companyId: user.companyId,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      address: body.address || null,
    },
  });

  return NextResponse.json(customer, { status: 201 });
}
