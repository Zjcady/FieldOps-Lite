import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, requireWrite, getPagination, getSafeSearch, validateBody, safeDate } from "@/lib/api-utils";
import { jobCreateSchema } from "@/lib/validations/job";

export async function GET(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const crewId = searchParams.get("crewId");
  const search = getSafeSearch(request);
  const { skip, take } = getPagination(request);

  const where: Record<string, unknown> = { companyId: user.companyId };
  if (status && status !== "all") where.status = status;
  if (crewId) where.crewId = crewId;
  if (search) where.title = { contains: search, mode: "insensitive" };

  const jobs = await prisma.job.findMany({
    where,
    select: {
      id: true, jobNumber: true, title: true, status: true, category: true,
      address: true, progress: true, estimatedEnd: true, isRecurring: true, priority: true,
      customer: { select: { name: true } },
      crew: { select: { name: true, _count: { select: { members: true } } } },
    },
    orderBy: { scheduledDate: "asc" },
    skip,
    take,
  });

  return NextResponse.json(jobs);
}

export async function POST(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const [data, valErr] = await validateBody(request, jobCreateSchema);
  if (valErr) return valErr;

  const jobCount = await prisma.job.count({ where: { companyId: user.companyId } });
  const jobNumber = `JOB-${new Date().getFullYear()}-${String(jobCount + 1).padStart(3, "0")}`;

  const job = await prisma.job.create({
    data: {
      companyId: user.companyId,
      customerId: data.customerId,
      propertyId: data.propertyId || null,
      crewId: data.crewId || null,
      jobNumber,
      title: data.title,
      description: data.description || null,
      type: data.type,
      category: data.category || null,
      priority: data.priority,
      scheduledDate: safeDate(data.scheduledDate),
      estimatedEnd: safeDate(data.estimatedEnd),
      estimatedCost: data.estimatedCost ?? null,
      estimatedHours: data.estimatedHours ?? null,
      address: data.address || null,
    },
    include: { customer: true, crew: true },
  });

  return NextResponse.json(job, { status: 201 });
}
