import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, apiSuccess, requireWrite, parseBody } from "@/lib/api-utils";

export async function GET() {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { name: true, email: true, phone: true, address: true, slug: true },
  });

  if (!company) return apiError("Company not found", 404);

  return apiSuccess(company);
}

export async function PUT(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const [body, parseErr] = await parseBody<{
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  }>(request);
  if (parseErr) return parseErr;

  if (!body.name || !body.name.trim()) {
    return apiError("Company name is required", 400);
  }

  const updated = await prisma.company.update({
    where: { id: user.companyId },
    data: {
      name: body.name.trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      address: body.address?.trim() || null,
    },
    select: { name: true, email: true, phone: true, address: true, slug: true },
  });

  return apiSuccess(updated);
}
