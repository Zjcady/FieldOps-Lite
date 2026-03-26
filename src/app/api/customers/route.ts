import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, validateBody, getPagination, withErrorHandler } from "@/lib/api-utils";
import { customerCreateSchema } from "@/lib/validations/job";

export const GET = withErrorHandler(async function GET(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { skip, take } = getPagination(request);

  const customers = await prisma.customer.findMany({
    where: { companyId: user.companyId },
    include: {
      properties: true,
      jobs: {
        select: { id: true, title: true, status: true, progress: true, estimatedEnd: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      _count: { select: { jobs: true } },
    },
    orderBy: { name: "asc" },
    skip,
    take,
  });
  // Strip portalToken from list responses (it's a bearer credential)
  const safe = customers.map(({ portalToken: _pt, ...rest }) => rest);
  return NextResponse.json(safe);
});

export const POST = withErrorHandler(async function POST(request: NextRequest) {
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
      portalToken: crypto.randomUUID(),
    },
  });

  return NextResponse.json(customer, { status: 201 });
});
