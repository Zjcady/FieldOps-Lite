"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

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

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function CrewPage() {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crews")
      .then((r) => r.json())
      .then((d) => { setCrews(d); setLoading(false); });
  }, []);

  const assignedCrews = crews.filter((c) => c.jobs.length > 0);
  const unassignedCrews = crews.filter((c) => c.jobs.length === 0);

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

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold tracking-tight">Crew & Dispatch</h1>
        <p className="text-sm text-muted-foreground">{crews.length} crews · {assignedCrews.length} active today</p>
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
                    <Progress value={activeJob.progress} className="mt-2 h-1" />
                  )}
                </div>
              )}

              {crew.jobs.length > 1 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  +{crew.jobs.length - 1} more job{crew.jobs.length > 2 ? "s" : ""}
                </div>
              )}
            </Card>
          );
        })}
      </div>

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
                    <Button size="sm" variant="default">
                      Assign
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
