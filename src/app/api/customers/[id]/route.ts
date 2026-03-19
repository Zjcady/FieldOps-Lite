import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireAdmin } from "@/lib/api-utils";

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
        select: { id: true, title: true, status: true, jobNumber: true, estimatedCost: true },
        orderBy: { createdAt: "desc" },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!customer) return apiError("Customer not found", 404);

  return NextResponse.json(customer);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { id } = await params;
  const body = await request.json();

  // Only allow updating specific fields
  const { name, email, phone, address } = body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return apiError("Name is required", 400);
  }

  const existing = await prisma.customer.findUnique({
    where: { id, companyId: user.companyId },
  });
  if (!existing) return apiError("Customer not found", 404);

  const updated = await prisma.customer.update({
    where: { id, companyId: user.companyId },
    data: {
      name: name.trim(),
      email: email || null,
      phone: phone || null,
      address: address || null,
    },
    include: {
      properties: true,
      jobs: {
        select: { id: true, title: true, status: true, jobNumber: true, estimatedCost: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id, companyId: user.companyId },
    include: {
      jobs: {
        where: {
          status: { notIn: ["completed", "cancelled", "invoiced"] },
        },
        select: { id: true },
      },
    },
  });

  if (!customer) return apiError("Customer not found", 404);

  if (customer.jobs.length > 0) {
    return apiError("Cannot delete customer with active jobs", 400);
  }

  await prisma.customer.delete({ where: { id, companyId: user.companyId } });

  return NextResponse.json({ success: true });
}
