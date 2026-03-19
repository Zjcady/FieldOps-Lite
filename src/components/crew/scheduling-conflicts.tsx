"use client";

import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useFetch } from "@/lib/hooks/use-fetch";

interface ConflictJob {
  id: string;
  title: string;
  scheduledDate: string | null;
  estimatedEnd: string | null;
}

interface Conflict {
  crew: { id: string; name: string };
  jobs: ConflictJob[];
  overlapDays: number;
}

export function SchedulingConflicts() {
  const { data, loading } = useFetch<{ conflicts: Conflict[] }>("/api/crews/conflicts");
  const conflicts = data?.conflicts ?? [];

  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Scheduling Conflicts
        </h2>
        <Card className="h-20 animate-pulse" />
      </div>
    );
  }

  if (conflicts.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Scheduling Conflicts
      </h2>
      <div className="space-y-3">
        {conflicts.map((conflict, i) => (
          <Card key={i} className="border-l-[3px] border-l-amber-500 p-4">
            <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              {conflict.crew.name} — Overlap
            </div>
            <p className="text-sm text-muted-foreground">
              {conflict.jobs.map((j) => j.title).join(" & ")} overlap by {conflict.overlapDays} day
              {conflict.overlapDays !== 1 ? "s" : ""}.
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
