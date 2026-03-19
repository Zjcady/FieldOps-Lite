"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { CalendarDays, AlertCircle, UserPlus } from "lucide-react";
import { SchedulingConflicts } from "@/components/crew/scheduling-conflicts";
import { useFetch, safeMutate } from "@/lib/hooks/use-fetch";

interface CrewMember {
  id: string;
  role: string;
  user: { id: string; name: string; role: string };
}

interface CrewJob {
  id: string;
  title: string;
  status: string;
  progress: number;
  address: string | null;
  customer: { name: string } | null;
}

interface Crew {
  id: string;
  name: string;
  color: string;
  members: CrewMember[];
  jobs: CrewJob[];
}

interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function AddMemberButton({ crewId, existingMemberIds, onAdded }: { crewId: string; existingMemberIds: string[]; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const { data: teamMembers } = useFetch<TeamUser[]>(open ? "/api/team" : null);
  const [adding, setAdding] = useState(false);

  const available = (teamMembers ?? []).filter((t) => !existingMemberIds.includes(t.id));

  async function handleSelect(userId: string) {
    setAdding(true);
    await safeMutate(`/api/crews/${crewId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setAdding(false);
    setOpen(false);
    onAdded();
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="mt-2">
        <UserPlus className="mr-1.5 h-3.5 w-3.5" />
        Add Member
      </Button>
    );
  }

  return (
    <div className="mt-2">
      <select
        disabled={adding}
        onChange={(e) => { if (e.target.value) handleSelect(e.target.value); }}
        className="rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        defaultValue=""
      >
        <option value="" disabled>Select team member...</option>
        {available.map((t) => (
          <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
        ))}
      </select>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)} className="ml-2">
        Cancel
      </Button>
    </div>
  );
}

export default function CrewPage() {
  const { data: crews, loading, error, refetch } = useFetch<Crew[]>("/api/crews");

  const assignedCrews = (crews ?? []).filter((c) => c.jobs.length > 0);
  const unassignedCrews = (crews ?? []).filter((c) => c.jobs.length === 0);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => <Card key={i} className="h-40 animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (<div className="p-4"><Card className="border-red-500/30 p-4"><div className="flex items-center gap-2 text-sm text-red-400"><AlertCircle className="h-4 w-4" />{error}</div></Card></div>);
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Crew & Dispatch</h1>
          <p className="text-sm text-muted-foreground">{crews?.length ?? 0} crews · {assignedCrews.length} active today</p>
        </div>
        <Link href="/crew/schedule" className="inline-flex h-7 items-center gap-1.5 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium transition-colors hover:bg-muted">
          <CalendarDays className="h-3.5 w-3.5" />
          Schedule
        </Link>
      </div>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Today&apos;s Schedule
      </h2>

      <div className="mb-6 space-y-3">
        {assignedCrews.map((crew) => {
          const lead = crew.members.find((m) => m.role === "lead");
          const activeJob = crew.jobs[0];

          return (
            <Card key={crew.id} className="p-4">
              <div className="flex items-center gap-3 border-b border-border pb-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback style={{ backgroundColor: `${crew.color}25`, color: crew.color }} className="text-xs font-semibold">
                    {getInitials(crew.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{crew.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {lead ? `Lead: ${lead.user.name}` : "No lead"} · {crew.members.length} members
                  </div>
                </div>
                {activeJob && (
                  <StatusBadge status={activeJob.status === "active" ? "active" : "scheduled"} />
                )}
              </div>

              {activeJob && (
                <div className="mt-3 rounded-lg bg-secondary p-3">
                  <div className="text-sm font-semibold">{activeJob.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {activeJob.progress}% done
                  </div>
                  {activeJob.progress > 0 && (
                    <Progress value={activeJob.progress} className="mt-2 h-1.5" />
                  )}
                </div>
              )}

              {crew.jobs.length > 1 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  +{crew.jobs.length - 1} more job{crew.jobs.length > 2 ? "s" : ""}
                </div>
              )}

              <AddMemberButton
                crewId={crew.id}
                existingMemberIds={crew.members.map((m) => m.user.id)}
                onAdded={refetch}
              />
            </Card>
          );
        })}
      </div>

      {/* TODO: Replace placeholder utilization data with real API call to /api/crews/[id]/utilization */}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Monthly Utilization
      </h2>
      <div className="mb-6 space-y-3">
        {(crews ?? []).map((crew) => {
          // TODO: Fetch real utilization data from /api/crews/${crew.id}/utilization
          // Use crew index as deterministic seed for placeholder data
          const placeholderHours = ((crew.name.charCodeAt(0) * 7 + 42) % 140) + 20;
          const maxHours = 160;
          const pct = (placeholderHours / maxHours) * 100;
          const barColor = pct > 75 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";

          return (
            <Card key={`util-${crew.id}`} className="p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium">{crew.name}</span>
                <span className="text-xs text-muted-foreground">{placeholderHours}h / {maxHours}h</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </Card>
          );
        })}
      </div>

      <SchedulingConflicts />

      {unassignedCrews.length > 0 && (
        <>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Unassigned Today
          </h2>
          <div className="space-y-3">
            {unassignedCrews.map((crew) => {
              const lead = crew.members.find((m) => m.role === "lead");
              return (
                <Card key={crew.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
                        {getInitials(crew.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{crew.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {lead ? `Lead: ${lead.user.name}` : "No lead"} · {crew.members.length} members · Available
                      </div>
                    </div>
                    <Button size="sm" variant="default" nativeButton={false} render={<Link href="/crew/schedule" />}>
                      Assign
                    </Button>
                  </div>
                  <AddMemberButton
                    crewId={crew.id}
                    existingMemberIds={crew.members.map((m) => m.user.id)}
                    onAdded={refetch}
                  />
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
