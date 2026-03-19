"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFetch } from "@/lib/hooks/use-fetch";
import { ZoomIn, ZoomOut, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Job {
  id: string;
  title: string;
  status: string;
  scheduledDate: string | null;
  estimatedEnd: string | null;
  crew: { name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500",
  scheduled: "bg-blue-500",
  paused: "bg-amber-500",
  completed: "bg-gray-500",
};

const ZOOM_LEVELS = [14, 21, 30, 45, 60];

export default function TimelinePage() {
  const { data: jobs, loading, error } = useFetch<Job[]>("/api/jobs");
  const [zoomIndex, setZoomIndex] = useState(2); // default 30 days

  const totalDays = ZOOM_LEVELS[zoomIndex];

  const now = new Date();
  const rangeStart = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), [now.getFullYear(), now.getMonth()]);
  const rangeEnd = useMemo(() => new Date(rangeStart.getTime() + totalDays * 86400000), [rangeStart, totalDays]);

  const rangeStartMs = rangeStart.getTime();
  const rangeEndMs = rangeEnd.getTime();

  // Filter jobs that have both dates and overlap with current range
  const timelineJobs = useMemo(() => {
    return (jobs ?? []).filter((j) => {
      if (!j.scheduledDate || !j.estimatedEnd) return false;
      const start = new Date(j.scheduledDate);
      const end = new Date(j.estimatedEnd);
      return start.getTime() < rangeEndMs && end.getTime() > rangeStartMs;
    });
  }, [jobs, rangeStartMs, rangeEndMs]);

  // Group by crew
  const crewRows = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const job of timelineJobs) {
      const crewName = job.crew?.name || "Unassigned";
      if (!map.has(crewName)) map.set(crewName, []);
      map.get(crewName)!.push(job);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [timelineJobs]);

  // Generate date labels
  const dateLabels = useMemo(() => {
    const labels: { date: Date; label: string }[] = [];
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(rangeStart.getTime() + i * 86400000);
      labels.push({ date: d, label: `${d.getMonth() + 1}/${d.getDate()}` });
    }
    return labels;
  }, [rangeStartMs, totalDays]);

  function getBarStyle(job: Job) {
    const start = new Date(job.scheduledDate!);
    const end = new Date(job.estimatedEnd!);
    const clampedStart = Math.max(start.getTime(), rangeStart.getTime());
    const clampedEnd = Math.min(end.getTime(), rangeEnd.getTime());
    const totalMs = rangeEnd.getTime() - rangeStart.getTime();
    const left = ((clampedStart - rangeStart.getTime()) / totalMs) * 100;
    const width = ((clampedEnd - clampedStart) / totalMs) * 100;
    return { left: `${left}%`, width: `${Math.max(width, 1)}%` };
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Job Timeline</h1>
          <p className="text-sm text-muted-foreground">
            {rangeStart.toLocaleDateString("en-US", { month: "long", year: "numeric" })} &mdash; {totalDays} day view
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={zoomIndex <= 0}
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
            aria-label="Zoom in (fewer days)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={zoomIndex >= ZOOM_LEVELS.length - 1}
            onClick={() => setZoomIndex((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
            aria-label="Zoom out (more days)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/jobs" />}>
            Back to Jobs
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-4 border-red-500/30 p-4">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="h-64 animate-pulse" />
      ) : crewRows.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No jobs with scheduled dates found.</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-4">
          {/* Date header */}
          <div className="relative mb-1 ml-36 h-6 border-b border-border">
            {dateLabels.filter((_, i) => i % Math.max(1, Math.floor(totalDays / 15)) === 0).map((d, i) => {
              const pct = ((d.date.getTime() - rangeStart.getTime()) / (rangeEnd.getTime() - rangeStart.getTime())) * 100;
              return (
                <span
                  key={i}
                  className="absolute text-[10px] text-muted-foreground"
                  style={{ left: `${pct}%` }}
                >
                  {d.label}
                </span>
              );
            })}
          </div>

          {/* Crew rows */}
          <div className="space-y-1">
            {crewRows.map(([crewName, crewJobs]) => (
              <div key={crewName}>
                {crewJobs.map((job) => (
                  <div key={job.id} className="flex items-center gap-2 py-1">
                    <div className="w-36 shrink-0 truncate text-xs font-medium" title={crewName}>
                      {crewName}
                    </div>
                    <div className="relative h-7 flex-1 rounded bg-secondary">
                      <Link
                        href={`/jobs/${job.id}`}
                        className={`absolute flex h-full items-center rounded px-2 text-[11px] font-medium text-white truncate transition-opacity hover:opacity-80 ${STATUS_COLORS[job.status] || "bg-gray-500"}`}
                        style={getBarStyle(job)}
                        title={`${job.title} (${job.status})`}
                      >
                        {job.title}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
                <span className="text-xs text-muted-foreground capitalize">{status}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
