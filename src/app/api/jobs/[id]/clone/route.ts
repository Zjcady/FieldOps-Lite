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

  const original = await prisma.job.findUnique({
    where: { id, companyId: user.companyId },
  });
  if (!original) return apiError("Job not found", 404);

  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const jobNumber = `JOB-${year}-${rand}`;

  const cloned = await prisma.job.create({
    data: {
      companyId: user.companyId,
      customerId: original.customerId,
      propertyId: original.propertyId,
      jobNumber,
      title: `Copy of ${original.title}`,
      description: original.description,
      type: original.type,
      category: original.category,
      priority: original.priority,
      address: original.address,
      estimatedCost: original.estimatedCost,
      estimatedHours: original.estimatedHours,
      status: "scheduled",
      progress: 0,
    },
    include: { customer: true, crew: true },
  });

  return NextResponse.json(cloned, { status: 201 });
}
