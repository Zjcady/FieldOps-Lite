import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, requireWrite, parseBody, apiError, getPagination, withErrorHandler } from "@/lib/api-utils";

export const GET = withErrorHandler(async function GET(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { skip, take } = getPagination(request, 200);

  const vendors = await prisma.vendor.findMany({
    where: { companyId: user.companyId },
    include: { _count: { select: { materials: true } } },
    orderBy: { name: "asc" },
    skip,
    take,
  });
  return NextResponse.json(vendors);
});

export const POST = withErrorHandler(async function POST(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const [body, parseErr] = await parseBody<{
    name?: string;
    contact?: string;
    phone?: string;
    email?: string;
    category?: string;
  }>(request as never);
  if (parseErr) return parseErr;

  if (!body.name || !body.name.trim()) {
    return apiError("Vendor name is required", 400);
  }

  const vendor = await prisma.vendor.create({
    data: {
      companyId: user.companyId,
      name: body.name.trim(),
      contact: body.contact || null,
      phone: body.phone || null,
      email: body.email || null,
      category: body.category || null,
    },
  });

  return NextResponse.json(vendor, { status: 201 });
});
