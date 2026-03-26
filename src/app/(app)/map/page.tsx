"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface Job {
  id: string;
  title: string;
  jobNumber: string;
  address?: string | null;
  status: string;
  estimatedCost?: number | null;
  customer?: { name: string } | null;
}

interface AreaGroup {
  area: string;
  jobs: Job[];
  totalCost: number;
}

function parseCity(address: string): string {
  // Try to extract city from common address formats
  // "123 Main St, Springfield, IL 62701" -> "Springfield"
  // "Springfield, IL" -> "Springfield"
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length >= 3) return parts[parts.length - 2];
  if (parts.length === 2) return parts[0];
  return address;
}

export default function MapPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/jobs?take=200", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load jobs (${r.status})`);
        return r.json();
      })
      .then((data) => { if (!controller.signal.aborted) setJobs(Array.isArray(data) ? data : []); })
      .catch((e) => { if (e.name !== "AbortError" && !controller.signal.aborted) setError(e instanceof Error ? e.message : "Failed to load jobs"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  // Group jobs by parsed city/area
  const groups: AreaGroup[] = [];
  const areaMap: Record<string, Job[]> = {};

  jobs.forEach((job) => {
    if (!job.address) return;
    const area = parseCity(job.address);
    if (!areaMap[area]) areaMap[area] = [];
    areaMap[area].push(job);
  });

  Object.entries(areaMap)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([area, areaJobs]) => {
      groups.push({
        area,
        jobs: areaJobs,
        totalCost: areaJobs.reduce((sum, j) => sum + (j.estimatedCost || 0), 0),
      });
    });

  const jobsWithoutAddress = jobs.filter((j) => !j.address);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Map View</h1>
        <p className="mt-1 text-sm text-muted-foreground">Jobs organized by geographic area</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : groups.length === 0 && jobsWithoutAddress.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">No jobs found.</div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.area} className="rounded-lg border border-border">
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-semibold">{group.area}</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {group.jobs.length} job{group.jobs.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {group.totalCost > 0 && (
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatCurrency(group.totalCost)}
                  </span>
                )}
              </div>
              <div className="divide-y divide-border">
                {group.jobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <div className="text-sm font-medium">{job.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {job.jobNumber}
                        {job.customer?.name ? ` \u00b7 ${job.customer.name}` : ""}
                      </div>
                    </div>
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs capitalize">
                      {job.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {jobsWithoutAddress.length > 0 && (
            <div className="rounded-lg border border-border">
              <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold">No Address</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {jobsWithoutAddress.length} job{jobsWithoutAddress.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="divide-y divide-border">
                {jobsWithoutAddress.map((job) => (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <div className="text-sm font-medium">{job.title}</div>
                      <div className="text-xs text-muted-foreground">{job.jobNumber}</div>
                    </div>
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs capitalize">
                      {job.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
