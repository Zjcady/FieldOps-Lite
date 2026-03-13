import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const crewId = searchParams.get("crewId");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (crewId) where.crewId = crewId;
  if (search) where.title = { contains: search };

  const jobs = await prisma.job.findMany({
    where,
    include: {
      customer: true,
      crew: { include: { members: { include: { user: true } } } },
      tasks: { orderBy: { sortOrder: "asc" } },
      _count: { select: { photos: true, notes: true } },
    },
    orderBy: { scheduledDate: "asc" },
  });

  return NextResponse.json(jobs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const jobCount = await prisma.job.count();
  const jobNumber = `JOB-2026-${String(jobCount + 1).padStart(3, "0")}`;

  const job = await prisma.job.create({
    data: {
      companyId: body.companyId,
      customerId: body.customerId,
      propertyId: body.propertyId || null,
      crewId: body.crewId || null,
      jobNumber,
      title: body.title,
      description: body.description || null,
      type: body.type || "project",
      category: body.category || null,
      priority: body.priority || "medium",
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
      estimatedEnd: body.estimatedEnd ? new Date(body.estimatedEnd) : null,
      address: body.address || null,
    },
    include: { customer: true, crew: true },
  });

  return NextResponse.json(job, { status: 201 });
}
