import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, withRequestId } from "@/lib/api-utils";

export async function GET() {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  const cid = user.companyId;
  const [activeJobs, pendingPermits, totalRevenue, crewsOut, recentActivity] = await Promise.all([
    prisma.job.count({ where: { companyId: cid, status: { in: ["active", "scheduled", "paused"] } } }),
    prisma.permit.count({ where: { companyId: cid, status: { in: ["pending", "submitted", "in_review"] } } }),
    prisma.invoice.aggregate({ _sum: { total: true }, where: { companyId: cid, status: { in: ["paid", "sent"] } } }),
    prisma.crew.count({ where: { companyId: cid, jobs: { some: { status: "active" } } } }),
    prisma.activityLog.findMany({
      where: { job: { companyId: cid } },
      include: { job: true, user: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    activeJobs,
    pendingPermits,
    totalRevenue: totalRevenue._sum.total ?? 0,
    crewsOut,
    recentActivity,
  }, { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" } });
}
