import prisma from "@/lib/prisma";
import { MetricCard } from "@/components/shared/metric-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { formatShortDate, formatCurrency } from "@/lib/format";
import Link from "next/link";
import { MapPin, Users, AlertTriangle, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [activeJobs, pendingPermits, revenue, crewsOut, todaysJobs] =
    await Promise.all([
      prisma.job.count({
        where: { status: { in: ["active", "scheduled", "paused", "waiting_permit", "waiting_inspection", "waiting_materials"] } },
      }),
      prisma.permit.count({
        where: { status: { in: ["pending", "submitted", "in_review"] } },
      }),
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { status: { in: ["paid", "sent"] } },
      }),
      prisma.crew.count({
        where: { jobs: { some: { status: "active" } } },
      }),
      prisma.job.findMany({
        where: { status: { in: ["active", "scheduled"] } },
        include: {
          customer: true,
          crew: { include: { members: true } },
        },
        orderBy: { scheduledDate: "asc" },
        take: 5,
      }),
    ]);

  const totalRev = revenue._sum.total ?? 0;

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
          change="↑ 2 from last week"
          changeColor="text-green-400"
          valueColor="text-blue-400"
        />
        <MetricCard
          value={pendingPermits}
          label="Pending Permits"
          change="1 expiring soon"
          changeColor="text-amber-400"
          valueColor="text-amber-400"
        />
        <MetricCard
          value={formatCurrency(totalRev)}
          label="Revenue MTD"
          change="↑ 11% vs last mo"
          changeColor="text-green-400"
          valueColor="text-green-400"
        />
        <MetricCard
          value={crewsOut}
          label="Crews Out Today"
          change="2 unassigned"
          changeColor="text-muted-foreground"
          valueColor="text-purple-400"
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
        {todaysJobs.map((job) => (
          <Link key={job.id} href={`/jobs/${job.id}`}>
            <Card className="cursor-pointer p-4 transition-colors hover:border-primary/30">
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
                  <div className="h-1 overflow-hidden rounded-full bg-border">
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
        ))}
      </div>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Alerts
      </h2>
      <div className="space-y-3">
        <Card className="border-l-[3px] border-l-amber-500 p-4">
          <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Permit Expiring
          </div>
          <p className="text-sm text-muted-foreground">
            Thornwood Fence — City permit expires in 4 days. Renew by Mar 16.
          </p>
        </Card>
        <Card className="border-l-[3px] border-l-green-500 p-4">
          <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Inspection Passed
          </div>
          <p className="text-sm text-muted-foreground">
            Sanders Lanai — Final inspection approved. Job ready to close.
          </p>
        </Card>
      </div>
    </div>
  );
}
