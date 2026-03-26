import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { getUser } from "@/lib/auth/get-user";
import { DashboardContent, type DashboardData } from "@/components/dashboard/dashboard-content";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getUser();
  const companyId = user?.companyId;

  if (!companyId) {
    redirect("/login");
  }

  const now = new Date();
  /* eslint-disable react-hooks/purity -- server component, not a hook */
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000);
  const oneWeekAgo = new Date(Date.now() - 7 * 86400000);
  const oneWeekFromNow = new Date(Date.now() + 7 * 86400000);
  /* eslint-enable react-hooks/purity */
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    activeJobs, pendingPermits, revenue, crewsOut, todaysJobs,
    recentNewJobs, expiringPermits, lastMonthRevenue, unassignedCrews,
    recentPassedInspections, materialsNeeded,
  ] = await Promise.all([
    prisma.job.count({
      where: { companyId, status: { in: ["active", "scheduled", "paused", "waiting_permit", "waiting_inspection", "waiting_materials"] } },
    }),
    prisma.permit.count({
      where: { companyId, status: { in: ["pending", "submitted", "in_review"] } },
    }),
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: { companyId, status: { in: ["paid", "sent"] } },
    }),
    prisma.crew.count({
      where: { companyId, jobs: { some: { status: "active" } } },
    }),
    prisma.job.findMany({
      where: { companyId, status: { in: ["active", "scheduled"] } },
      include: { customer: true, crew: { include: { members: { select: { id: true } } } } },
      orderBy: { scheduledDate: "asc" },
      take: 5,
    }),
    prisma.job.count({
      where: { companyId, status: { in: ["active", "scheduled", "paused", "waiting_permit", "waiting_inspection", "waiting_materials"] }, createdAt: { gte: twoWeeksAgo } },
    }),
    prisma.permit.findMany({
      where: { companyId, expiryDate: { lte: oneWeekFromNow, gte: now } },
      include: { job: { select: { title: true } } },
      take: 5,
    }),
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: { companyId, status: { in: ["paid", "sent"] }, createdAt: { gte: lastMonthStart, lt: thisMonthStart } },
    }),
    prisma.crew.count({
      where: { companyId, isActive: true, jobs: { none: { status: "active" } } },
    }),
    prisma.inspection.findMany({
      where: { companyId, status: "passed", completedDate: { gte: oneWeekAgo } },
      include: { job: { select: { title: true } } },
      take: 5,
    }),
    prisma.material.findMany({
      where: { job: { companyId }, status: "needed", orderedDate: null },
      include: { job: { select: { title: true } } },
      take: 10,
    }),
  ]);

  const totalRev = Number(revenue._sum.total ?? 0);
  const lastMonthTotal = Number(lastMonthRevenue._sum.total ?? 0);
  const revChangePercent = lastMonthTotal > 0 ? Math.round(((totalRev - lastMonthTotal) / lastMonthTotal) * 100) : 0;

  // Serialize all data into plain objects for the client component
  const dashboardData: DashboardData = {
    userName: user.name,
    activeJobs,
    pendingPermits,
    totalRevenue: formatCurrency(totalRev),
    crewsOut,
    jobsChangeText: recentNewJobs > 0 ? `↑ ${recentNewJobs} in last 2 weeks` : "No new jobs recently",
    jobsChangePositive: recentNewJobs > 0,
    permitsChangeText: expiringPermits.length > 0 ? `${expiringPermits.length} expiring soon` : "None expiring soon",
    permitsExpiring: expiringPermits.length > 0,
    revChangeText: lastMonthTotal > 0 ? `${revChangePercent >= 0 ? "↑" : "↓"} ${Math.abs(revChangePercent)}% vs last mo` : "No prior month data",
    revChangePositive: revChangePercent >= 0,
    crewsChangeText: unassignedCrews > 0 ? `${unassignedCrews} unassigned` : "All crews assigned",
    todaysJobs: todaysJobs.map((j) => ({
      id: j.id,
      title: j.title,
      status: j.status,
      address: j.address,
      category: j.category,
      progress: j.progress,
      estimatedEnd: j.estimatedEnd?.toISOString() ?? null,
      crew: j.crew ? { name: j.crew.name, members: j.crew.members } : null,
    })),
    expiringPermits: expiringPermits.map((p) => ({
      id: p.id,
      type: p.type,
      daysLeft: p.expiryDate ? Math.ceil((p.expiryDate.getTime() - now.getTime()) / 86400000) : 0,
      jobTitle: p.job?.title ?? "Unknown job",
    })),
    recentPassedInspections: recentPassedInspections.map((i) => ({
      id: i.id,
      type: i.type,
      jobTitle: i.job?.title ?? "Unknown job",
      completedDate: i.completedDate?.toISOString() ?? null,
    })),
    materialsNeeded: materialsNeeded.map((m) => ({
      id: m.id,
      name: m.name,
      jobTitle: m.job?.title ?? "Unknown job",
    })),
  };

  return <DashboardContent data={dashboardData} />;
}
