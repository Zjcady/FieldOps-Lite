import prisma from "@/lib/prisma";
import { MetricCard } from "@/components/shared/metric-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { formatShortDate, formatCurrency } from "@/lib/format";
import Link from "next/link";
import { MapPin, Users, AlertTriangle, CheckCircle2, ClipboardList } from "lucide-react";
import { getUser } from "@/lib/auth/get-user";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getUser();
  const companyId = user?.companyId;

  // If no user (shouldn't happen due to middleware), show empty state
  if (!companyId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
      </div>
    );
  }

  const now = new Date();
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000);
  const oneWeekAgo = new Date(Date.now() - 7 * 86400000);
  const oneWeekFromNow = new Date(Date.now() + 7 * 86400000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    activeJobs,
    pendingPermits,
    revenue,
    crewsOut,
    todaysJobs,
    recentNewJobs,
    expiringPermits,
    lastMonthRevenue,
    unassignedCrews,
    recentPassedInspections,
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
      include: {
        customer: true,
        crew: { include: { members: true } },
      },
      orderBy: { scheduledDate: "asc" },
      take: 5,
    }),
    // New jobs in last 2 weeks
    prisma.job.count({
      where: {
        companyId,
        status: { in: ["active", "scheduled", "paused", "waiting_permit", "waiting_inspection", "waiting_materials"] },
        createdAt: { gte: twoWeeksAgo },
      },
    }),
    // Permits expiring within 7 days
    prisma.permit.findMany({
      where: {
        companyId,
        expiryDate: { lte: oneWeekFromNow, gte: now },
      },
      include: { job: { select: { title: true } } },
      take: 5,
    }),
    // Last month revenue for comparison
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: {
        companyId,
        status: { in: ["paid", "sent"] },
        createdAt: { gte: lastMonthStart, lt: thisMonthStart },
      },
    }),
    // Crews with no active jobs
    prisma.crew.count({
      where: { companyId, isActive: true, jobs: { none: { status: "active" } } },
    }),
    // Recently passed inspections
    prisma.inspection.findMany({
      where: {
        companyId,
        status: "passed",
        completedDate: { gte: oneWeekAgo },
      },
      include: { job: { select: { title: true } } },
      take: 5,
    }),
  ]);

  const totalRev = revenue._sum.total ?? 0;
  const lastMonthTotal = lastMonthRevenue._sum.total ?? 0;
  const revChangePercent = lastMonthTotal > 0
    ? Math.round(((totalRev - lastMonthTotal) / lastMonthTotal) * 100)
    : 0;
  const revChangeText = lastMonthTotal > 0
    ? `${revChangePercent >= 0 ? "↑" : "↓"} ${Math.abs(revChangePercent)}% vs last mo`
    : "No prior month data";

  const jobsChangeText = recentNewJobs > 0
    ? `↑ ${recentNewJobs} in last 2 weeks`
    : "No new jobs recently";

  const permitsChangeText = expiringPermits.length > 0
    ? `${expiringPermits.length} expiring soon`
    : "None expiring soon";

  const crewsChangeText = unassignedCrews > 0
    ? `${unassignedCrews} unassigned`
    : "All crews assigned";

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          value={activeJobs}
          label="Active Jobs"
          change={jobsChangeText}
          changeColor={recentNewJobs > 0 ? "text-green-400" : "text-muted-foreground"}
          valueColor="text-blue-400"
          borderColor="border-l-blue-400"
        />
        <MetricCard
          value={pendingPermits}
          label="Pending Permits"
          change={permitsChangeText}
          changeColor={expiringPermits.length > 0 ? "text-amber-400" : "text-muted-foreground"}
          valueColor="text-amber-400"
          borderColor="border-l-amber-400"
        />
        <MetricCard
          value={formatCurrency(totalRev)}
          label="Revenue MTD"
          change={revChangeText}
          changeColor={revChangePercent >= 0 ? "text-green-400" : "text-red-400"}
          valueColor="text-green-400"
          borderColor="border-l-green-400"
        />
        <MetricCard
          value={crewsOut}
          label="Crews Out Today"
          change={crewsChangeText}
          changeColor="text-muted-foreground"
          valueColor="text-purple-400"
          borderColor="border-l-purple-400"
        />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Today&apos;s Jobs
        </h2>
        <Link href="/jobs" className="text-sm font-medium text-primary">
          See all
        </Link>
      </div>

      <div className="mb-6 space-y-3">
        {todaysJobs.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center">
            <ClipboardList className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">No jobs scheduled</p>
            <p className="text-xs text-muted-foreground/70">
              Jobs will appear here when they are active or scheduled.
            </p>
          </Card>
        ) : (
          todaysJobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="cursor-pointer p-4 transition-all hover:border-primary/30 hover:translate-y-[-1px]">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold leading-tight">{job.title}</h3>
                  <StatusBadge status={job.status} />
                </div>
                {job.address && (
                  <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    {job.address}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {job.category && (
                    <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-400">
                      {job.category}
                    </span>
                  )}
                  {job.crew && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {job.crew.name} · {job.crew.members.length} workers
                    </span>
                  )}
                </div>
                {job.progress > 0 && (
                  <div className="mt-2.5">
                    <div className="h-1.5 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                      <span>{job.progress}% complete</span>
                      {job.estimatedEnd && (
                        <span>Est. done {formatShortDate(job.estimatedEnd)}</span>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            </Link>
          ))
        )}
      </div>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Alerts
      </h2>
      <div className="space-y-3">
        {expiringPermits.length === 0 && recentPassedInspections.length === 0 && (
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground">No alerts at this time.</p>
          </Card>
        )}
        {expiringPermits.map((permit) => {
          const daysLeft = permit.expiryDate
            ? Math.ceil((permit.expiryDate.getTime() - Date.now()) / 86400000)
            : 0;
          return (
            <Card key={permit.id} className="border-l-[3px] border-l-amber-500 p-4">
              <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                Permit Expiring
              </div>
              <p className="text-sm text-muted-foreground">
                {permit.job?.title ?? "Unknown job"} — {permit.type} permit expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}.
              </p>
            </Card>
          );
        })}
        {recentPassedInspections.map((inspection) => (
          <Card key={inspection.id} className="border-l-[3px] border-l-green-500 p-4">
            <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Inspection Passed
            </div>
            <p className="text-sm text-muted-foreground">
              {inspection.job?.title ?? "Unknown job"} — {inspection.type} inspection passed.
              {inspection.completedDate && ` Completed ${formatShortDate(inspection.completedDate)}.`}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
