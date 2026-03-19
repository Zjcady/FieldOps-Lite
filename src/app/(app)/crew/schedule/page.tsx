"use client";

import { useState, useMemo } from "react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { AlertCircle, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface ScheduleJob {
  id: string;
  title: string;
  status: string;
  address: string | null;
  scheduledDate: string | null;
  estimatedEnd: string | null;
  customer: { name: string } | null;
}

interface CrewSchedule {
  id: string;
  name: string;
  color: string;
  jobs: ScheduleJob[];
}

function getWeekDates(offset: number): Date[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDayHeader(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function CrewSchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [assigningJob, setAssigningJob] = useState<string | null>(null);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const start = weekDates[0].toISOString().split("T")[0];
  const end = weekDates[6].toISOString().split("T")[0];
  const { data: crews, loading, error, refetch } = useFetch<CrewSchedule[]>(
    `/api/crews?schedule=true&start=${start}&end=${end}`
  );

  const handleReassign = async (jobId: string, crewId: string) => {
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crewId }),
    });
    if (res.ok) {
      toast.success("Job reassigned");
      setAssigningJob(null);
      refetch();
    } else {
      toast.error("Failed to reassign");
    }
  };

  return (
    <div className="p-4 md:p-6">
      <Link href="/crew" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Crew
      </Link>

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Weekly Schedule</h1>
        <div className="flex items-center gap-2">
          <Button size="icon-sm" variant="outline" onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setWeekOffset(0)}>Today</Button>
          <Button size="icon-sm" variant="outline" onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Card key={i} className="h-24 animate-pulse" />)}
        </div>
      ) : error ? (
        <Card className="flex items-center gap-3 border-destructive/50 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Day headers */}
            <div className="mb-2 grid grid-cols-[120px_repeat(7,1fr)] gap-1">
              <div className="text-xs font-semibold text-muted-foreground">Crew</div>
              {weekDates.map((d) => (
                <div key={d.toISOString()} className={`text-center text-[11px] font-medium ${isSameDay(d, new Date()) ? "text-primary" : "text-muted-foreground"}`}>
                  {formatDayHeader(d)}
                </div>
              ))}
            </div>

            {/* Crew rows */}
            {(crews ?? []).length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">No crews found for this week.</div>
            )}
            {(crews ?? []).map((crew) => (
              <div key={crew.id} className="mb-1 grid grid-cols-[120px_repeat(7,1fr)] gap-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: crew.color }} />
                  <span className="truncate">{crew.name}</span>
                </div>
                {weekDates.map((day) => {
                  const dayJobs = crew.jobs.filter((j) => {
                    if (!j.scheduledDate) return false;
                    const sd = new Date(j.scheduledDate);
                    const ed = j.estimatedEnd ? new Date(j.estimatedEnd) : sd;
                    return day >= new Date(sd.toDateString()) && day <= new Date(ed.toDateString());
                  });

                  return (
                    <div key={day.toISOString()} className={`min-h-[48px] rounded-md border border-border/50 p-1 ${isSameDay(day, new Date()) ? "bg-primary/5" : ""}`}>
                      {dayJobs.map((job) => (
                        <button
                          key={job.id}
                          onClick={() => setAssigningJob(assigningJob === job.id ? null : job.id)}
                          className="mb-0.5 w-full rounded bg-primary/15 px-1.5 py-0.5 text-left text-[10px] font-medium text-primary transition-colors hover:bg-primary/25"
                          title={`${job.title}\n${job.customer?.name || ""}\n${job.address || ""}`}
                          aria-label={`${job.title} - click to reassign`}
                        >
                          <div className="truncate">{job.title}</div>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reassign panel */}
      {assigningJob && (
        <Card className="mt-4 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Reassign to Crew</h3>
          <div className="flex flex-wrap gap-2">
            {(crews ?? []).map((c) => (
              <Button key={c.id} size="sm" variant="outline" onClick={() => handleReassign(assigningJob, c.id)}>
                <div className="mr-1.5 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => setAssigningJob(null)}>Cancel</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
