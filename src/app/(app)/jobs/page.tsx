"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { STATUS_META } from "@/lib/job-state-machine";
import { MapPin, Users, Plus, AlertCircle, FileUp, LayoutTemplate, GanttChart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFetch } from "@/lib/hooks/use-fetch";
import { toast } from "sonner";

const ALL_STATUSES = ["scheduled", "active", "paused", "waiting_permit", "waiting_inspection", "waiting_materials", "completed", "cancelled"];

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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const router = useRouter();

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

  const jobList = jobs ?? [];

  // #27: Quick status update handler
  const handleQuickStatus = useCallback(async (jobId: string, newStatus: string) => {
    setLocalStatuses((prev) => ({ ...prev, [jobId]: newStatus }));
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        throw new Error("Failed to update status");
      }
      toast.success(`Status updated to ${STATUS_META[newStatus]?.label || newStatus}`);
    } catch {
      // Rollback
      setLocalStatuses((prev) => {
        const next = { ...prev };
        delete next[jobId];
        return next;
      });
      toast.error("Failed to update status");
    }
  }, []);

  // #28: Keyboard navigation on job list
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't interfere when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, jobList.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < jobList.length) {
        e.preventDefault();
        router.push(`/jobs/${jobList[selectedIndex].id}`);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [jobList, selectedIndex, router]);

  // Scroll selected card into view
  useEffect(() => {
    if (selectedIndex >= 0 && cardRefs.current[selectedIndex]) {
      cardRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Reset selection when jobs change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [filter, debouncedSearch]);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">All Jobs</h1>
          <p className="text-sm text-muted-foreground">
            {jobs?.length ?? 0} jobs
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/jobs/templates" />}>
            <LayoutTemplate className="mr-1 h-4 w-4" />
            Templates
          </Button>
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/jobs/import" />}>
            <FileUp className="mr-1 h-4 w-4" />
            Import CSV
          </Button>
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/jobs/timeline" />}>
            <GanttChart className="mr-1 h-4 w-4" />
            Timeline
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/jobs/new" />}>
            <Plus className="mr-1 h-4 w-4" />
            New Job
          </Button>
        </div>
      </div>

      <div className="mb-3 space-y-2">
        <input
          id="job-search"
          placeholder="Search jobs... (Ctrl+K)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search jobs"
          className="flex h-8 w-full rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5">
            <label htmlFor="job-from-date" className="text-xs text-muted-foreground whitespace-nowrap">Start Date</label>
            <input
              id="job-from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label htmlFor="job-to-date" className="text-xs text-muted-foreground whitespace-nowrap">End Date</label>
            <input
              id="job-to-date"
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
          {jobList.length === 0 && (
            <Card className="p-8 text-center">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {filter !== "all" || debouncedSearch ? "No jobs match your filters." : "No jobs yet. Create your first job to get started."}
              </p>
            </Card>
          )}
          {jobList.map((job, index) => (
            <div
              key={job.id}
              ref={(el) => { cardRefs.current[index] = el; }}
            >
              <Link href={`/jobs/${job.id}`}>
                <Card
                  className={`cursor-pointer p-4 transition-all hover:border-primary/30 hover:translate-y-[-1px] ${
                    index === selectedIndex ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
                  }`}
                  title={`${job.title}\n${job.address || ""}\n${job.customer?.name || ""}`}
                >
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold leading-tight">{job.title}</h3>
                      <span className="text-[11px] text-muted-foreground">{job.jobNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* #27: Quick status dropdown */}
                      <select
                        value={localStatuses[job.id] ?? job.status}
                        onClick={(e) => e.preventDefault()}
                        onChange={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleQuickStatus(job.id, e.target.value);
                        }}
                        onClickCapture={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="h-6 rounded border border-border bg-background px-1 text-[11px] text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        aria-label={`Change status for ${job.title}`}
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_META[s]?.label || s}
                          </option>
                        ))}
                      </select>
                      <StatusBadge status={localStatuses[job.id] ?? job.status} />
                    </div>
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
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
