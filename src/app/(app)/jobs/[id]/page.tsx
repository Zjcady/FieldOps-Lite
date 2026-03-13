"use client";

import { useEffect, useState, use } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { Timeline } from "@/components/shared/timeline";
import { getValidTransitions, STATUS_META } from "@/lib/job-state-machine";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/format";
import {
  ArrowLeft,
  MapPin,
  Users,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  status: string;
  completedAt: string | null;
}

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  category: string;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: { name: string } | null;
}

interface JobDetail {
  id: string;
  jobNumber: string;
  title: string;
  description: string | null;
  status: string;
  category: string | null;
  type: string;
  priority: string;
  progress: number;
  address: string | null;
  scheduledDate: string | null;
  startDate: string | null;
  completedDate: string | null;
  estimatedEnd: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  estimatedHours: number | null;
  actualHours: number | null;
  customer: { name: string; email: string | null; phone: string | null } | null;
  crew: { name: string; color: string; members: { user: { name: string; role: string } }[] } | null;
  tasks: Task[];
  photos: Photo[];
  notes: { id: string; content: string; type: string; createdAt: string; user: { name: string } | null }[];
  permits: { id: string; permitNumber: string | null; type: string; status: string }[];
  inspections: { id: string; type: string; status: string; scheduledDate: string | null; inspector: string | null }[];
  activityLogs: ActivityLog[];
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then((d) => { setJob(d); setLoading(false); });
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    const res = await fetch(`/api/jobs/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setJob((prev) => prev ? { ...prev, ...updated } : prev);
      toast.success(`Job status changed to ${STATUS_META[newStatus]?.label || newStatus}`);
    } else {
      toast.error("Failed to change status");
    }
  };

  const handleTaskToggle = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    const res = await fetch(`/api/jobs/${id}/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status: newStatus }),
    });
    if (res.ok) {
      setJob((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId ? { ...t, status: newStatus } : t
          ),
        };
      });
    }
  };

  if (loading || !job) {
    return (
      <div className="p-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-card" />
      </div>
    );
  }

  const transitions = getValidTransitions(job.status as Parameters<typeof getValidTransitions>[0]);
  const completedTasks = job.tasks.filter((t) => t.status === "completed").length;

  const timelineItems = job.activityLogs.map((log) => {
    let parsed: Record<string, string> = {};
    try { parsed = JSON.parse(log.details || "{}"); } catch { /* empty */ }
    const title =
      log.action === "status_change"
        ? `Status: ${STATUS_META[parsed.from]?.label || parsed.from} → ${STATUS_META[parsed.to]?.label || parsed.to}`
        : log.action === "task_completed"
        ? `Task completed: ${parsed.task}`
        : log.action === "photo_uploaded"
        ? `Photo uploaded: ${parsed.caption}`
        : log.action === "inspection_passed"
        ? `Inspection passed: ${parsed.type}`
        : log.action === "inspection_failed"
        ? `Inspection failed: ${parsed.type}`
        : log.action;

    return {
      id: log.id,
      title,
      subtitle: `${log.user?.name || "System"} · ${formatDateTime(log.createdAt)}`,
      dotColor: log.action.includes("fail") ? "bg-red-400" : log.action.includes("pass") || log.action.includes("complete") ? "bg-green-400" : "bg-blue-400",
    };
  });

  return (
    <div className="p-4 md:p-6">
      <Link href="/jobs" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{job.title}</h1>
          <p className="text-sm text-muted-foreground">{job.jobNumber}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/* Quick Info */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="border-l-[3px] border-l-green-400 p-3">
          <div className="text-xl font-bold text-green-400">{job.progress}%</div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">Complete</div>
        </Card>
        <Card className="border-l-[3px] border-l-blue-400 p-3">
          <div className="text-xl font-bold text-blue-400">{formatDate(job.estimatedEnd)}</div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">Est. Finish</div>
        </Card>
        {job.estimatedCost && (
          <Card className="border-l-[3px] border-l-amber-400 p-3">
            <div className="text-xl font-bold text-amber-400">{formatCurrency(job.estimatedCost)}</div>
            <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">Budget</div>
          </Card>
        )}
        {job.actualCost && (
          <Card className="border-l-[3px] border-l-green-400 p-3">
            <div className="text-xl font-bold text-green-400">{formatCurrency(job.actualCost)}</div>
            <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">Actual</div>
          </Card>
        )}
      </div>

      {/* Status Actions */}
      {transitions.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {transitions.map((t) => (
            <Button
              key={t}
              size="sm"
              variant={t === "active" || t === "completed" ? "default" : "outline"}
              onClick={() => handleStatusChange(t)}
            >
              {STATUS_META[t]?.label || t}
            </Button>
          ))}
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({completedTasks}/{job.tasks.length})</TabsTrigger>
          <TabsTrigger value="photos">Photos ({job.photos.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {job.description && (
            <Card className="p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Description</h3>
              <p className="text-sm">{job.description}</p>
            </Card>
          )}
          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Details</h3>
            <div className="space-y-2 text-sm">
              {job.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {job.address}
                </div>
              )}
              {job.crew && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {job.crew.name} · {job.crew.members.length} members
                </div>
              )}
              {job.scheduledDate && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Scheduled: {formatDate(job.scheduledDate)}
                </div>
              )}
              {job.estimatedHours && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {job.actualHours ?? 0}/{job.estimatedHours} hours
                </div>
              )}
            </div>
          </Card>
          {job.customer && (
            <Card className="p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Customer</h3>
              <div className="text-sm font-medium">{job.customer.name}</div>
              {job.customer.email && <div className="text-xs text-muted-foreground">{job.customer.email}</div>}
              {job.customer.phone && <div className="text-xs text-muted-foreground">{job.customer.phone}</div>}
            </Card>
          )}
          {job.permits.length > 0 && (
            <Card className="p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Permits</h3>
              {job.permits.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{p.type} {p.permitNumber && `(${p.permitNumber})`}</span>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Card className="p-4">
            <div className="space-y-1">
              {job.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleTaskToggle(task.id, task.status)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted"
                >
                  {task.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-400" />
                  ) : task.status === "in_progress" ? (
                    <Clock className="h-5 w-5 flex-shrink-0 text-blue-400" />
                  ) : (
                    <Circle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  )}
                  <span className={task.status === "completed" ? "text-sm text-muted-foreground line-through" : "text-sm"}>
                    {task.title}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {job.photos.map((photo) => (
              <Card
                key={photo.id}
                className="group relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden transition-all hover:border-primary/30"
              >
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/20 transition-colors group-hover:text-muted-foreground/40" />
                  {photo.caption && (
                    <div className="px-2 text-center text-[10px] leading-tight text-muted-foreground">
                      {photo.caption}
                    </div>
                  )}
                </div>
                <div className="absolute right-1.5 top-1.5">
                  <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground">
                    {photo.category}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card className="p-4">
            {timelineItems.length > 0 ? (
              <Timeline items={timelineItems} />
            ) : (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
