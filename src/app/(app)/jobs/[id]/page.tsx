"use client";

import { useState, useMemo, useCallback, use } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { Timeline } from "@/components/shared/timeline";
import { getValidTransitions, STATUS_META } from "@/lib/job-state-machine";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/format";
import { useFetch, safeMutate } from "@/lib/hooks/use-fetch";
import {
  ArrowLeft, MapPin, Users, Calendar, CheckCircle2, Circle,
  Clock, Image as ImageIcon, FileText, Pencil, AlertCircle, Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { TaskAddForm } from "@/components/jobs/task-add-form";

interface Task { id: string; title: string; status: string; completedAt: string | null }
interface Photo { id: string; url: string; caption: string | null; category: string; createdAt: string }
interface ActivityLog { id: string; action: string; details: string | null; createdAt: string; user: { name: string } | null }
interface JobDetail {
  id: string; jobNumber: string; title: string; description: string | null;
  status: string; category: string | null; type: string; priority: string;
  progress: number; address: string | null;
  scheduledDate: string | null; startDate: string | null; completedDate: string | null;
  estimatedEnd: string | null; estimatedCost: number | null; actualCost: number | null;
  estimatedHours: number | null; actualHours: number | null;
  customer: { name: string; email: string | null; phone: string | null } | null;
  crew: { name: string; color: string; members: { user: { name: string; role: string } }[] } | null;
  tasks: Task[]; photos: Photo[];
  notes: { id: string; content: string; type: string; createdAt: string; user: { name: string } | null }[];
  permits: { id: string; permitNumber: string | null; type: string; status: string }[];
  inspections: { id: string; type: string; status: string; scheduledDate: string | null; inspector: string | null }[];
  activityLogs: ActivityLog[];
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: job, loading, error } = useFetch<JobDetail>(`/api/jobs/${id}`);
  const [localJob, setLocalJob] = useState<Partial<JobDetail>>({});
  const [changingStatus, setChangingStatus] = useState<string | null>(null); // #23: loading state

  const merged = job ? { ...job, ...localJob } as JobDetail : null;

  const handleStatusChange = useCallback(async (newStatus: string) => {
    setChangingStatus(newStatus); // #23
    const { data: updated, error: err } = await safeMutate(`/api/jobs/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setChangingStatus(null);
    if (err) { toast.error(err); return; }
    if (updated) {
      setLocalJob((prev) => ({ ...prev, ...(updated as Record<string, unknown>) }));
      toast.success(`Status changed to ${STATUS_META[newStatus]?.label || newStatus}`);
    }
  }, [id]);

  const handleTaskToggle = useCallback(async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    // #24: optimistic update
    setLocalJob((prev) => ({
      ...prev,
      tasks: (prev.tasks ?? job?.tasks ?? []).map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      ),
    }));
    const { error: err } = await safeMutate(`/api/jobs/${id}/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status: newStatus }),
    });
    if (err) {
      // Rollback on failure
      setLocalJob((prev) => ({
        ...prev,
        tasks: (prev.tasks ?? job?.tasks ?? []).map((t) =>
          t.id === taskId ? { ...t, status: currentStatus } : t
        ),
      }));
      toast.error("Failed to update task");
    }
  }, [id, job?.tasks]);

  // #40: memoize timeline
  const timelineItems = useMemo(() => {
    if (!merged) return [];
    return merged.activityLogs.map((log) => {
      let parsed: Record<string, string> = {};
      try { parsed = JSON.parse(log.details || "{}"); } catch { /* empty */ }
      const title =
        log.action === "status_change"
          ? `Status: ${STATUS_META[parsed.from]?.label || parsed.from} → ${STATUS_META[parsed.to]?.label || parsed.to}`
          : log.action === "task_completed" ? `Task completed: ${parsed.task}`
          : log.action === "photo_uploaded" ? `Photo uploaded: ${parsed.caption}`
          : log.action === "inspection_passed" ? `Inspection passed: ${parsed.type}`
          : log.action === "inspection_failed" ? `Inspection failed: ${parsed.type}`
          : log.action;
      return {
        id: log.id, title,
        subtitle: `${log.user?.name || "System"} · ${formatDateTime(log.createdAt)}`,
        dotColor: log.action.includes("fail") ? "bg-red-400" : log.action.includes("pass") || log.action.includes("complete") ? "bg-green-400" : "bg-blue-400",
      };
    });
  }, [merged?.activityLogs]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || (!job && !error)) {
    return (
      <div className="p-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-card" />
      </div>
    );
  }

  // #17: error state
  if (error || !merged) {
    return (
      <div className="p-4">
        <Link href="/jobs" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Link>
        <Card className="mt-4 border-red-500/30 p-6 text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-400" />
          <p className="text-sm text-red-400">{error || "Job not found"}</p>
        </Card>
      </div>
    );
  }

  const tasks = localJob.tasks ?? merged.tasks;
  const transitions = getValidTransitions(merged.status as Parameters<typeof getValidTransitions>[0]);
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="p-4 md:p-6">
      <Link href="/jobs" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Jobs
      </Link>

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{merged.title}</h1>
          <p className="text-sm text-muted-foreground">{merged.jobNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/jobs/${id}/edit`} />}>
            <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
          </Button>
          <StatusBadge status={merged.status} />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="border-l-[3px] border-l-green-400 p-3">
          <div className="text-xl font-bold text-green-400">{merged.progress}%</div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">Complete</div>
        </Card>
        <Card className="border-l-[3px] border-l-blue-400 p-3">
          <div className="text-xl font-bold text-blue-400">{formatDate(merged.estimatedEnd)}</div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">Est. Finish</div>
        </Card>
        {merged.estimatedCost != null && (
          <Card className="border-l-[3px] border-l-amber-400 p-3">
            <div className="text-xl font-bold text-amber-400">{formatCurrency(merged.estimatedCost)}</div>
            <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">Budget</div>
          </Card>
        )}
        {merged.actualCost != null && (
          <Card className="border-l-[3px] border-l-green-400 p-3">
            <div className="text-xl font-bold text-green-400">{formatCurrency(merged.actualCost)}</div>
            <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">Actual</div>
          </Card>
        )}
      </div>

      {merged.estimatedCost && merged.actualCost && merged.actualCost > merged.estimatedCost && (
        <Card className="mb-4 border-l-[3px] border-l-red-500 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-red-400">
            <AlertCircle className="h-4 w-4" />
            Over budget by {formatCurrency(merged.actualCost - merged.estimatedCost)} ({((merged.actualCost / merged.estimatedCost - 1) * 100).toFixed(0)}%)
          </div>
        </Card>
      )}

      {/* #23: status buttons with loading state */}
      {transitions.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {transitions.map((t) => (
            <Button
              key={t} size="sm"
              variant={t === "active" || t === "completed" ? "default" : "outline"}
              disabled={changingStatus !== null}
              onClick={() => handleStatusChange(t)}
            >
              {changingStatus === t && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              {STATUS_META[t]?.label || t}
            </Button>
          ))}
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({completedTasks}/{tasks.length})</TabsTrigger>
          <TabsTrigger value="photos">Photos ({merged.photos.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({merged.notes.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {merged.description && (
            <Card className="p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Description</h3>
              <p className="text-sm">{merged.description}</p>
            </Card>
          )}
          <Card className="p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Details</h3>
            <div className="space-y-2 text-sm">
              {merged.address && (<div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />{merged.address}</div>)}
              {merged.crew && (<div className="flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4" />{merged.crew.name} · {merged.crew.members.length} members</div>)}
              {merged.scheduledDate && (<div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" />Scheduled: {formatDate(merged.scheduledDate)}</div>)}
              {merged.estimatedHours != null && (<div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" />{merged.actualHours ?? 0}/{merged.estimatedHours} hours</div>)}
            </div>
          </Card>
          {merged.customer && (
            <Card className="p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Customer</h3>
              <div className="text-sm font-medium">{merged.customer.name}</div>
              {merged.customer.email && <div className="text-xs text-muted-foreground">{merged.customer.email}</div>}
              {merged.customer.phone && <div className="text-xs text-muted-foreground">{merged.customer.phone}</div>}
            </Card>
          )}
          {merged.permits.length > 0 && (
            <Card className="p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Permits</h3>
              {merged.permits.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{p.type} {p.permitNumber && `(${p.permitNumber})`}</span></div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Card className="p-4">
            <div className="mb-3">
              <TaskAddForm
                jobId={id}
                onTaskAdded={(task) => setLocalJob((prev) => ({ ...prev, tasks: [...(prev.tasks ?? merged.tasks), task] }))}
              />
            </div>
            <div className="space-y-1">
              {/* #34: aria-label on task buttons */}
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleTaskToggle(task.id, task.status)}
                  aria-label={`${task.title}: ${task.status === "completed" ? "completed" : "pending"}`}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted"
                >
                  {task.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-400" />
                  ) : task.status === "in_progress" ? (
                    <Clock className="h-5 w-5 flex-shrink-0 text-blue-400" />
                  ) : (
                    <Circle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  )}
                  <span className={task.status === "completed" ? "text-sm text-muted-foreground line-through" : "text-sm"}>{task.title}</span>
                </button>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {merged.photos.map((photo) => (
              <Card key={photo.id} className="group relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden transition-all hover:border-primary/30">
                {photo.url && photo.url.startsWith("http") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo.url} alt={photo.caption || "Job photo"} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/20 transition-colors group-hover:text-muted-foreground/40" />
                    {photo.caption && (<div className="px-2 text-center text-[10px] leading-tight text-muted-foreground">{photo.caption}</div>)}
                  </div>
                )}
                <div className="absolute right-1.5 top-1.5">
                  <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground">{photo.category}</span>
                </div>
                {photo.url && photo.url.startsWith("http") && photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <div className="text-[10px] leading-tight text-white">{photo.caption}</div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card className="p-4">
            {merged.notes.length > 0 ? (
              <div className="space-y-3">
                {merged.notes.map((note) => (
                  <div key={note.id} className="rounded-lg border border-border p-3">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{note.user?.name || "System"}</span>
                      <span>&middot;</span>
                      <span>{formatDateTime(note.createdAt)}</span>
                      {note.type !== "general" && (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{note.type}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card className="p-4">
            {timelineItems.length > 0 ? <Timeline items={timelineItems} /> : <p className="text-sm text-muted-foreground">No activity yet.</p>}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
