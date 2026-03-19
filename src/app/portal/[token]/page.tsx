"use client";

import { useEffect, useState, use } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { Timeline } from "@/components/shared/timeline";
import { STATUS_META } from "@/lib/job-state-machine";
import { formatDate, formatDateTime } from "@/lib/format";
import { Triangle, Send, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { APP_CONFIG } from "@/lib/app-config";

interface PortalJob {
  id: string;
  title: string;
  status: string;
  progress: number;
  estimatedEnd: string | null;
  description: string | null;
  tasks: { id: string; title: string; status: string }[];
  photos: { id: string; url: string; caption: string | null; category: string; createdAt: string }[];
  permits: { id: string; type: string; status: string }[];
  inspections: { id: string; type: string; status: string; scheduledDate: string | null }[];
  activityLogs: { id: string; action: string; details: string | null; createdAt: string }[];
}

interface PortalMessage {
  id: string;
  senderType: string;
  content: string;
  createdAt: string;
}

interface PortalData {
  id: string;
  name: string;
  email: string | null;
  jobs: PortalJob[];
  messages: PortalMessage[];
}

export default function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const fetchData = () => {
    fetch(`/api/portal/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark messages as read when portal loads
  useEffect(() => {
    if (data && data.messages.length > 0) {
      fetch(`/api/portal/${token}/messages`, { method: "PATCH" }).catch(() => {});
    }
  }, [data?.messages.length, token]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    const res = await fetch(`/api/portal/${token}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message, senderType: "customer" }),
    });
    if (res.ok) {
      const newMsg = await res.json();
      setData((prev) => prev ? { ...prev, messages: [...prev.messages, newMsg] } : prev);
      setMessage("");
      toast.success("Message sent!");
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2">
        <h1 className="text-lg font-semibold">Portal Not Found</h1>
        <p className="text-sm text-muted-foreground">This project link is invalid or has been revoked.</p>
      </div>
    );
  }

  const job = data.jobs[0];

  const timelineItems = job?.activityLogs.map((log) => {
    let parsed: Record<string, string> = {};
    try { parsed = JSON.parse(log.details || "{}"); } catch { /* empty */ }
    const title = log.action === "status_change"
      ? `Status updated to ${STATUS_META[parsed.to]?.label || parsed.to}`
      : log.action === "task_completed"
      ? `Completed: ${parsed.task}`
      : log.action;
    return {
      id: log.id,
      title,
      subtitle: formatDateTime(log.createdAt),
      dotColor: log.action.includes("complete") ? "bg-green-400" : "bg-blue-400",
    };
  }) || [];

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-4 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Triangle className="h-3.5 w-3.5 text-white" fill="white" />
          </div>
          <span className="text-base font-semibold">{APP_CONFIG.name}</span>
        </div>
        <div className="text-xs text-muted-foreground">Customer Project Portal</div>
      </div>

      <div className="p-4">
        <h1 className="mb-1 text-center text-lg font-semibold">{data.name}</h1>
        {job && (
          <>
            <p className="mb-4 text-center text-sm text-muted-foreground">{job.title}</p>

            {/* Progress */}
            <Card className="mb-4 p-4 text-center">
              <div className="mb-1 text-3xl font-bold text-primary">{job.progress}%</div>
              <div className="mb-3 text-xs text-muted-foreground">Project Complete</div>
              <Progress value={job.progress} className="h-2" />
              <div className="mt-3 flex justify-center gap-6">
                <div>
                  <StatusBadge status={job.status} />
                </div>
                {job.estimatedEnd && (
                  <div className="text-xs text-muted-foreground">
                    Est. done {formatDate(job.estimatedEnd)}
                  </div>
                )}
              </div>
            </Card>

            {/* Tasks */}
            {job.tasks.length > 0 && (
              <Card className="mb-4 p-4">
                <h2 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Progress</h2>
                {job.tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 py-1.5">
                    <div className={`h-2 w-2 rounded-full ${task.status === "completed" ? "bg-green-400" : task.status === "in_progress" ? "bg-blue-400" : "bg-muted-foreground/30"}`} />
                    <span className={`text-sm ${task.status === "completed" ? "text-muted-foreground line-through" : ""}`}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </Card>
            )}

            {/* Photos */}
            {job.photos.length > 0 && (
              <Card className="mb-4 p-4">
                <h2 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                  Photos ({job.photos.length})
                </h2>
                <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-lg">
                  {job.photos.map((photo) => (
                    <div key={photo.id} className="relative flex aspect-square items-center justify-center overflow-hidden bg-secondary">
                      {photo.url && photo.url.startsWith("http") ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo.url} alt={photo.caption || "Project photo"} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                      )}
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1 text-center text-[8px] text-white">
                          {photo.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Permits & Inspections */}
            {(job.permits.length > 0 || job.inspections.length > 0) && (
              <Card className="mb-4 p-4">
                <h2 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Compliance</h2>
                {job.permits.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm">{p.type} Permit</span>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
                {job.inspections.map((i) => (
                  <div key={i.id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm">{i.type} Inspection</span>
                    <StatusBadge status={i.status} />
                  </div>
                ))}
              </Card>
            )}

            {/* Timeline */}
            {timelineItems.length > 0 && (
              <Card className="mb-4 p-4">
                <h2 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Timeline</h2>
                <Timeline items={timelineItems.slice(0, 5)} />
              </Card>
            )}
          </>
        )}

        {/* Messages */}
        <Card className="p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Messages</h2>
          <div className="mb-4 space-y-2">
            {data.messages.map((msg) => (
              <div key={msg.id}>
                <div className={`text-[11px] ${msg.senderType === "customer" ? "text-right" : ""} text-muted-foreground`}>
                  {formatDateTime(msg.createdAt)} · {msg.senderType === "customer" ? "You" : APP_CONFIG.companyPlaceholder}
                </div>
                <div
                  className={`mt-0.5 max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.senderType === "customer"
                      ? "ml-auto bg-primary/20 text-cyan-300"
                      : "bg-secondary"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <Button size="icon" onClick={sendMessage} disabled={sending || !message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
