import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, apiError, requireWrite, getPagination, getSafeSearch, validateBody, safeDate, withRequestId, withErrorHandler } from "@/lib/api-utils";
import { jobCreateSchema } from "@/lib/validations/job";

export const GET = withErrorHandler(async function GET(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const crewId = searchParams.get("crewId");
  const search = getSafeSearch(request);
  const { skip, take } = getPagination(request);

  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, unknown> = { companyId: user.companyId, deletedAt: null };
  if (status && status !== "all") where.status = status;
  if (crewId) where.crewId = crewId;
  if (search) where.title = { contains: search, mode: "insensitive" };
  if (from || to) {
    const scheduledDateFilter: Record<string, Date> = {};
    if (from) scheduledDateFilter.gte = new Date(from);
    if (to) scheduledDateFilter.lte = new Date(to + "T23:59:59.999Z");
    where.scheduledDate = scheduledDateFilter;
  }

  // Sorting support
  const sortBy = searchParams.get("sortBy") || "created";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderByMap: Record<string, any> = {
    date: { scheduledDate: "asc" },
    status: { status: "asc" },
    customer: { customer: { name: "asc" } },
    cost: { estimatedCost: "desc" },
    created: { createdAt: "desc" },
  };
  const orderBy = orderByMap[sortBy] || orderByMap.created;

  const jobs = await prisma.job.findMany({
    where,
    select: {
      id: true, jobNumber: true, title: true, status: true, category: true,
      address: true, progress: true, estimatedEnd: true, isRecurring: true, priority: true,
      customer: { select: { name: true } },
      crew: { select: { name: true, _count: { select: { members: true } } } },
    },
    orderBy,
    skip,
    take,
  });

  return withRequestId(NextResponse.json(jobs));
});

export const POST = withErrorHandler(async function POST(request: NextRequest) {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const writeErr = requireWrite(user);
  if (writeErr) return writeErr;

  const [data, valErr] = await validateBody(request, jobCreateSchema);
  if (valErr) return valErr;

  // Verify all FK references belong to this company
  if (data.customerId) {
    const c = await prisma.customer.findUnique({ where: { id: data.customerId, companyId: user.companyId }, select: { id: true } });
    if (!c) return apiError("Customer not found", 404);
  }
  if (data.crewId) {
    const cr = await prisma.crew.findUnique({ where: { id: data.crewId, companyId: user.companyId }, select: { id: true } });
    if (!cr) return apiError("Crew not found", 404);
  }
  if (data.propertyId) {
    const p = await prisma.property.findUnique({ where: { id: data.propertyId, companyId: user.companyId }, select: { id: true } });
    if (!p) return apiError("Property not found", 404);
  }

  const year = new Date().getFullYear();
  const result = await prisma.$transaction(async (tx) => {
    // Lock-free unique job number using random suffix
    const rand = crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();
    const jobNumber = `JOB-${year}-${rand}`;

    const job = await tx.job.create({
      data: {
        companyId: user.companyId,
        customerId: data.customerId,
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
        propertyId: data.propertyId || null,
        crewId: data.crewId || null,
      },
      include: { customer: true, crew: true },
    });
    return job;
  });

  return NextResponse.json(result, { status: 201 });
});
