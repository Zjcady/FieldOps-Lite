"use client";

import { useState, useEffect } from "react";
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
  estimatedCost: number | null;
  actualCost: number | null;
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // #26: Cmd+K / Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("job-search")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const params = filter !== "all" ? `?status=${filter}` : "";
  const searchParam = debouncedSearch ? `${params ? "&" : "?"}search=${encodeURIComponent(debouncedSearch)}` : "";
  const fromParam = fromDate ? `${(params || searchParam) ? "&" : "?"}from=${fromDate}` : "";
  const toParam = toDate ? `${(params || searchParam || fromParam) ? "&" : "?"}to=${toDate}` : "";
  const { data: jobs, loading, error } = useFetch<Job[]>(`/api/jobs${params}${searchParam}${fromParam}${toParam}`);

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

      <div className="mb-3 space-y-2">
        <input
          id="job-search"
          placeholder="Search jobs... (Ctrl+K)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-8 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Start Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground whitespace-nowrap">End Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
        </div>
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

      <div aria-busy={loading}>
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
              <Card className="cursor-pointer p-4 transition-all hover:border-primary/30 hover:translate-y-[-1px]" title={`${job.title}\n${job.address || ""}\n${job.customer?.name || ""}`}>
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
                  {job.actualCost != null && job.estimatedCost != null && job.actualCost > job.estimatedCost && (
                    <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-medium text-red-400">
                      Over Budget
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
    </div>
  );
}
