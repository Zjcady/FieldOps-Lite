"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { MapPin, Users, Plus, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useFetch } from "@/lib/hooks/use-fetch";

interface Job {
  id: string;
  jobNumber: string;
  title: string;
  status: string;
  category: string | null;
  address: string | null;
  progress: number;
  estimatedEnd: string | null;
  isRecurring: boolean;
  crew: { name: string; _count?: { members: number } } | null;
  customer: { name: string } | null;
}

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Awaiting Permit", value: "waiting_permit" },
  { label: "Completed", value: "completed" },
];

export default function JobsPage() {
  const [filter, setFilter] = useState("all");
  const params = filter !== "all" ? `?status=${filter}` : "";
  const { data: jobs, loading, error } = useFetch<Job[]>(`/api/jobs${params}`);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">All Jobs</h1>
          <p className="text-sm text-muted-foreground">
            {jobs?.length ?? 0} jobs
          </p>
        </div>
        <Button size="sm" nativeButton={false} render={<Link href="/jobs/new" />}>
          <Plus className="mr-1 h-4 w-4" />
          New Job
        </Button>
      </div>

      {/* #33: aria-pressed on filter buttons */}
      <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Job status filter">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === f.value
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* #15: error state */}
      {error && (
        <Card className="mb-4 border-red-500/30 p-4">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-28 animate-pulse p-4" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(jobs ?? []).map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="cursor-pointer p-4 transition-all hover:border-primary/30 hover:translate-y-[-1px]">
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold leading-tight">{job.title}</h3>
                    <span className="text-[11px] text-muted-foreground">{job.jobNumber}</span>
                  </div>
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
                  {job.isRecurring && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      Recurring
                    </span>
                  )}
                  {job.crew && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {job.crew.name}
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
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
