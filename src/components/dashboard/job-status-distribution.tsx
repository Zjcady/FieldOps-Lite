"use client";

import { useFetch } from "@/lib/hooks/use-fetch";

interface Job {
  id: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500",
  scheduled: "bg-blue-500",
  paused: "bg-amber-500",
  completed: "bg-gray-500",
  waiting_permit: "bg-orange-500",
  waiting_inspection: "bg-indigo-500",
  waiting_materials: "bg-teal-500",
  cancelled: "bg-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  scheduled: "Scheduled",
  paused: "Paused",
  completed: "Completed",
  waiting_permit: "Waiting Permit",
  waiting_inspection: "Waiting Inspection",
  waiting_materials: "Waiting Materials",
  cancelled: "Cancelled",
};

export function JobStatusDistribution() {
  const { data: jobs, loading } = useFetch<Job[]>("/api/jobs");

  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Job Status
        </h2>
        <div className="h-8 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const counts: Record<string, number> = {};
  for (const job of jobs ?? []) {
    counts[job.status] = (counts[job.status] || 0) + 1;
  }

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Job Status
      </h2>
      <div className="flex flex-wrap gap-2">
        {entries.map(([status, count]) => (
          <div
            key={status}
            className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1"
          >
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status] || "bg-gray-400"}`} />
            <span className="text-xs font-medium">
              {STATUS_LABELS[status] || status}
            </span>
            <span className="text-xs text-muted-foreground">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
