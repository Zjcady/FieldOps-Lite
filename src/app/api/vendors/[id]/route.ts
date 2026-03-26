import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, requireWrite, requireAdmin, parseBody, apiError, withErrorHandler } from "@/lib/api-utils";

export const GET = withErrorHandler(async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const vendor = await prisma.vendor.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      materials: {
        include: { job: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!vendor) return apiError("Vendor not found", 404);
  return NextResponse.json(vendor);
});

export const PUT = withErrorHandler(async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const existing = await prisma.vendor.findUnique({
    where: { id, companyId: user.companyId },
  });
  if (!existing) return apiError("Vendor not found", 404);

  const [body, parseErr] = await parseBody<{
    name?: string;
    contact?: string;
    phone?: string;
    email?: string;
    category?: string;
  }>(request as never);
  if (parseErr) return parseErr;

  const vendor = await prisma.vendor.update({
    where: { id, companyId: user.companyId },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.contact !== undefined && { contact: body.contact || null }),
      ...(body.phone !== undefined && { phone: body.phone || null }),
      ...(body.email !== undefined && { email: body.email || null }),
      ...(body.category !== undefined && { category: body.category || null }),
    },
  });

  return NextResponse.json(vendor);
});

export const DELETE = withErrorHandler(async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  const vendor = await prisma.vendor.findUnique({
    where: { id, companyId: user.companyId },
    include: { _count: { select: { materials: true } } },
  });

  if (!vendor) return apiError("Vendor not found", 404);

  if (vendor._count.materials > 0) {
    return apiError("Cannot delete vendor with linked materials", 400);
  }

  await prisma.vendor.delete({ where: { id, companyId: user.companyId } });
  return NextResponse.json({ success: true });
});
