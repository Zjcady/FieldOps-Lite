import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const [activeJobs, pendingPermits, totalRevenue, crewsOut, recentActivity] = await Promise.all([
    prisma.job.count({ where: { status: { in: ["active", "scheduled", "paused"] } } }),
    prisma.permit.count({ where: { status: { in: ["pending", "submitted", "in_review"] } } }),
    prisma.invoice.aggregate({ _sum: { total: true }, where: { status: { in: ["paid", "sent"] } } }),
    prisma.crew.count({ where: { jobs: { some: { status: "active" } } } }),
    prisma.activityLog.findMany({
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
  });
}
