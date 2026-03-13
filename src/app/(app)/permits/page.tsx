"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { Timeline } from "@/components/shared/timeline";
import { formatDate } from "@/lib/format";
import { AlertTriangle, FileText, CheckCircle2, XCircle, CalendarDays } from "lucide-react";

interface Permit {
  id: string;
  permitNumber: string | null;
  type: string;
  status: string;
  jurisdiction: string | null;
  issuedDate: string | null;
  expiryDate: string | null;
  cost: number | null;
  job: { title: string } | null;
}

interface Inspection {
  id: string;
  type: string;
  status: string;
  scheduledDate: string | null;
  completedDate: string | null;
  inspector: string | null;
  result: string | null;
  notes: string | null;
  job: { title: string } | null;
}

const inspectionIcon = (status: string) => {
  switch (status) {
    case "passed": return <CheckCircle2 className="h-4 w-4 text-green-400" />;
    case "failed": return <XCircle className="h-4 w-4 text-red-400" />;
    case "scheduled": return <CalendarDays className="h-4 w-4 text-blue-400" />;
    default: return <FileText className="h-4 w-4 text-muted-foreground" />;
  }
};

const permitIcon = (status: string) => {
  switch (status) {
    case "approved": return <CheckCircle2 className="h-9 w-9 rounded-lg bg-green-500/12 p-2 text-green-400" />;
    case "in_review": return <FileText className="h-9 w-9 rounded-lg bg-purple-500/12 p-2 text-purple-400" />;
    default: return <AlertTriangle className="h-9 w-9 rounded-lg bg-amber-500/12 p-2 text-amber-400" />;
  }
};

export default function PermitsPage() {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/permits").then((r) => r.json()),
      fetch("/api/inspections").then((r) => r.json()),
    ]).then(([p, i]) => {
      setPermits(p);
      setInspections(i);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-card" />
      </div>
    );
  }

  const timelineItems = [
    ...inspections.map((i) => ({
      id: i.id,
      title: `${i.job?.title || "Unknown"} — ${i.type} Inspection ${i.status === "passed" ? "Passed" : i.status === "failed" ? "Failed" : "Scheduled"}`,
      subtitle: `${formatDate(i.completedDate || i.scheduledDate)}${i.inspector ? ` · Inspector: ${i.inspector}` : ""}`,
      dotColor: i.status === "passed" ? "bg-green-400" : i.status === "failed" ? "bg-red-400" : "bg-blue-400",
      date: new Date(i.completedDate || i.scheduledDate || 0),
    })),
    ...permits.map((p) => ({
      id: p.id,
      title: `${p.job?.title || "Unknown"} — Permit ${p.status === "approved" ? "Approved" : p.status === "in_review" ? "Submitted" : p.status}`,
      subtitle: `${formatDate(p.issuedDate)}${p.jurisdiction ? ` · ${p.jurisdiction}` : ""}`,
      dotColor: p.status === "approved" ? "bg-green-400" : p.status === "in_review" ? "bg-blue-400" : "bg-amber-400",
      date: new Date(p.issuedDate || p.expiryDate || 0),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold tracking-tight">Permits & Inspections</h1>
        <p className="text-sm text-muted-foreground">
          {permits.length} permits · {inspections.length} inspections
        </p>
      </div>

      <Tabs defaultValue="permits" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="permits">Permits</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="permits" className="mt-4">
          <Card className="p-4">
            {permits.map((permit, i) => (
              <div
                key={permit.id}
                className={`flex items-center gap-3 py-3 ${i < permits.length - 1 ? "border-b border-border" : ""}`}
              >
                {permitIcon(permit.status)}
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">
                    {permit.job?.title || "Unknown Job"} — {permit.type}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {permit.jurisdiction} · {permit.expiryDate ? `Expires ${formatDate(permit.expiryDate)}` : permit.permitNumber || "Pending"}
                  </div>
                </div>
                <StatusBadge status={permit.status} />
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="inspections" className="mt-4">
          <Card className="p-4">
            {inspections.map((insp, i) => (
              <div
                key={insp.id}
                className={`flex items-center gap-3 py-3 ${i < inspections.length - 1 ? "border-b border-border" : ""}`}
              >
                {inspectionIcon(insp.status)}
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">
                    {insp.job?.title || "Unknown"} — {insp.type}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {insp.status === "passed" || insp.status === "failed"
                      ? `${formatDate(insp.completedDate)}${insp.inspector ? ` · Inspector: ${insp.inspector}` : ""}`
                      : `Scheduled ${formatDate(insp.scheduledDate)}`}
                    {insp.notes && ` · ${insp.notes}`}
                  </div>
                </div>
                <StatusBadge status={insp.status} />
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card className="p-4">
            <Timeline items={timelineItems} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
