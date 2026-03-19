"use client";

import { useState, useEffect } from "react";
import { MetricCard } from "@/components/shared/metric-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { formatShortDate } from "@/lib/format";
import Link from "next/link";
import { MapPin, Users, AlertTriangle, CheckCircle2, ClipboardList, Package } from "lucide-react";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { JobStatusDistribution } from "@/components/dashboard/job-status-distribution";
import { DashboardCustomize } from "@/components/dashboard/dashboard-customize";
import { getVisibleWidgets, saveVisibleWidgets } from "@/components/dashboard/dashboard-config";

interface JobCard {
  id: string;
  title: string;
  status: string;
  address: string | null;
  category: string | null;
  progress: number;
  estimatedEnd: string | null;
  crew: { name: string; members: { id: string }[] } | null;
}

interface PermitAlert {
  id: string;
  type: string;
  daysLeft: number;
  jobTitle: string;
}

interface InspectionAlert {
  id: string;
  type: string;
  jobTitle: string;
  completedDate: string | null;
}

interface MaterialAlert {
  id: string;
  name: string;
  jobTitle: string;
}

export interface DashboardData {
  userName: string;
  activeJobs: number;
  pendingPermits: number;
  totalRevenue: string;
  crewsOut: number;
  jobsChangeText: string;
  jobsChangePositive: boolean;
  permitsChangeText: string;
  permitsExpiring: boolean;
  revChangeText: string;
  revChangePositive: boolean;
  crewsChangeText: string;
  todaysJobs: JobCard[];
  expiringPermits: PermitAlert[];
  recentPassedInspections: InspectionAlert[];
  materialsNeeded: MaterialAlert[];
}

export function DashboardContent({ data }: { data: DashboardData }) {
  const [visible, setVisible] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setVisible(getVisibleWidgets());
    setMounted(true);
  }, []);

  const handleChange = (widgets: Set<string>) => {
    setVisible(widgets);
    saveVisibleWidgets(widgets);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = data.userName.split(" ")[0];

  if (!mounted) {
    return (
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-card" />)}
        </div>
      </div>
    );
  }

  const alertCount = data.expiringPermits.length + data.recentPassedInspections.length + data.materialsNeeded.length;

  return (
    <div className="p-4 md:p-6">
      {/* Header with greeting + customize button */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{greeting}, {firstName}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <DashboardCustomize visible={visible} onChange={handleChange} />
      </div>

      {/* Key Metrics */}
      {visible.has("metrics") && (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard value={data.activeJobs} label="Active Jobs" change={data.jobsChangeText} changeColor={data.jobsChangePositive ? "text-green-400" : "text-muted-foreground"} valueColor="text-blue-400" borderColor="border-l-blue-400" />
          <MetricCard value={data.pendingPermits} label="Pending Permits" change={data.permitsChangeText} changeColor={data.permitsExpiring ? "text-amber-400" : "text-muted-foreground"} valueColor="text-amber-400" borderColor="border-l-amber-400" />
          <MetricCard value={data.totalRevenue} label="Revenue MTD" change={data.revChangeText} changeColor={data.revChangePositive ? "text-green-400" : "text-red-400"} valueColor="text-green-400" borderColor="border-l-green-400" />
          <MetricCard value={data.crewsOut} label="Crews Out Today" change={data.crewsChangeText} changeColor="text-muted-foreground" valueColor="text-purple-400" borderColor="border-l-purple-400" />
        </div>
      )}

      {/* Quick Actions */}
      {visible.has("quick-actions") && <QuickActions />}

      {/* Job Status Pills */}
      {visible.has("status-distribution") && <JobStatusDistribution />}

      {/* Today's Jobs */}
      {visible.has("todays-jobs") && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today&apos;s Jobs</h2>
            <Link href="/jobs" className="text-sm font-medium text-primary">See all</Link>
          </div>
          <div className="mb-6 space-y-3">
            {data.todaysJobs.length === 0 ? (
              <Card className="flex flex-col items-center justify-center p-8 text-center">
                <ClipboardList className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">No jobs scheduled</p>
                <p className="text-xs text-muted-foreground/70">Jobs appear here when active or scheduled.</p>
              </Card>
            ) : (
              data.todaysJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <Card className="cursor-pointer p-4 transition-all hover:border-primary/30 hover:translate-y-[-1px]">
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold leading-tight">{job.title}</h3>
                      <StatusBadge status={job.status} />
                    </div>
                    {job.address && (
                      <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />{job.address}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      {job.category && <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-400">{job.category}</span>}
                      {job.crew && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" />{job.crew.name} · {job.crew.members.length} workers</span>}
                    </div>
                    {job.progress > 0 && (
                      <div className="mt-2.5">
                        <div className="h-1.5 overflow-hidden rounded-full bg-border">
                          <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${job.progress}%` }} />
                        </div>
                        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                          <span>{job.progress}% complete</span>
                          {job.estimatedEnd && <span>Est. done {formatShortDate(job.estimatedEnd)}</span>}
                        </div>
                      </div>
                    )}
                  </Card>
                </Link>
              ))
            )}
          </div>
        </>
      )}

      {/* Alerts (priority sorted) */}
      {visible.has("alerts") && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alerts</h2>
            {alertCount > 0 && <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-400">{alertCount}</span>}
          </div>
          <div className="mb-6 space-y-3">
            {alertCount === 0 && (
              <Card className="p-4 text-center"><p className="text-sm text-muted-foreground">No alerts — you&apos;re all clear.</p></Card>
            )}
            {data.expiringPermits.map((p) => (
              <Card key={p.id} className="border-l-[3px] border-l-amber-500 p-4">
                <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-amber-400"><AlertTriangle className="h-3.5 w-3.5" />Permit Expiring</div>
                <p className="text-sm text-muted-foreground">{p.jobTitle} — {p.type} permit expires in {p.daysLeft} day{p.daysLeft !== 1 ? "s" : ""}.</p>
              </Card>
            ))}
            {data.materialsNeeded.map((m) => (
              <Card key={m.id} className="border-l-[3px] border-l-orange-500 p-4">
                <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-orange-400"><Package className="h-3.5 w-3.5" />Material Needed</div>
                <p className="text-sm text-muted-foreground">{m.name} for {m.jobTitle} — not yet ordered.</p>
              </Card>
            ))}
            {data.recentPassedInspections.map((i) => (
              <Card key={i.id} className="border-l-[3px] border-l-green-500 p-4">
                <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-green-400"><CheckCircle2 className="h-3.5 w-3.5" />Inspection Passed</div>
                <p className="text-sm text-muted-foreground">{i.jobTitle} — {i.type} inspection passed.{i.completedDate && ` Completed ${formatShortDate(i.completedDate)}.`}</p>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Recent Activity */}
      {visible.has("recent-activity") && <RecentActivity />}
    </div>
  );
}
