"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  MapPin,
  MessageSquare,
  Play,
  Plus,
  RotateCcw,
  Zap,
} from "lucide-react";
import { formatRelative } from "@/lib/format";

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  job: { id: string; title: string; jobNumber: string };
  user: { id: string; name: string } | null;
}

const ACTION_ICONS: Record<string, typeof Zap> = {
  status_change: RotateCcw,
  created: Plus,
  updated: Edit,
  photo_added: Camera,
  note_added: MessageSquare,
  checkin: MapPin,
  checkout: MapPin,
  task_completed: CheckCircle2,
  started: Play,
  completed: CheckCircle2,
  inspection: FileText,
  time_entry: Clock,
};

function getActionIcon(action: string) {
  return ACTION_ICONS[action] || Zap;
}

function getActionLabel(action: string, details: string | null): string {
  const labels: Record<string, string> = {
    status_change: details ? `Changed status: ${details}` : "Changed status",
    created: "Created job",
    updated: "Updated job",
    photo_added: "Added a photo",
    note_added: "Added a note",
    checkin: "Checked in",
    checkout: "Checked out",
    task_completed: "Completed a task",
    started: "Started job",
    completed: "Completed job",
    inspection: "Logged inspection",
    time_entry: "Logged time",
  };
  return labels[action] || details || action;
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">Recent activity across all jobs</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">No activity yet.</div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border md:left-[19px]" />

          <div className="space-y-1">
            {logs.map((log) => {
              const Icon = getActionIcon(log.action);
              return (
                <div key={log.id} className="relative flex gap-3 py-2.5 md:gap-4">
                  {/* Icon */}
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card md:h-10 md:w-10">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground md:h-4 md:w-4" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="font-medium">{log.user?.name ?? "System"}</span>
                      <span className="text-muted-foreground">{getActionLabel(log.action, log.details)}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <Link
                        href={`/jobs/${log.job.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {log.job.title}
                      </Link>
                      <span>{log.job.jobNumber}</span>
                      <span>&middot;</span>
                      <time>{formatRelative(log.createdAt)}</time>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
