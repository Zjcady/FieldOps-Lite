"use client";

import { useState } from "react";
import { useFetchAll, useFetch } from "@/lib/hooks/use-fetch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { Timeline } from "@/components/shared/timeline";
import { formatDate } from "@/lib/format";
import { PERMIT_STATUSES } from "@/lib/constants";
import { AlertCircle, AlertTriangle, FileText, CheckCircle2, XCircle, CalendarDays, Plus } from "lucide-react";

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

interface Job {
  id: string;
  title: string;
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
    case "approved": return <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/15"><CheckCircle2 className="h-4 w-4 text-green-400" /></div>;
    case "in_review": return <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/15"><FileText className="h-4 w-4 text-purple-400" /></div>;
    default: return <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15"><AlertTriangle className="h-4 w-4 text-amber-400" /></div>;
  }
};

function ExpiryBadge({ expiryDate }: { expiryDate: string | null }) {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const days = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">
        Expired
      </span>
    );
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
        Expires in {days}d
      </span>
    );
  }
  return null;
}

export default function PermitsPage() {
  const { data: [permits, inspections], loading, error, refetch } = useFetchAll<[Permit[], Inspection[]]>(["/api/permits", "/api/inspections"]);
  const { data: jobs } = useFetch<Job[]>("/api/jobs");

  // Add Permit form state
  const [showPermitForm, setShowPermitForm] = useState(false);
  const [permitSaving, setPermitSaving] = useState(false);
  const [permitError, setPermitError] = useState<string | null>(null);
  const [permitType, setPermitType] = useState("");
  const [permitJurisdiction, setPermitJurisdiction] = useState("");
  const [permitJobId, setPermitJobId] = useState("");
  const [permitStatus, setPermitStatus] = useState("pending");

  // Schedule Inspection form state
  const [showInspForm, setShowInspForm] = useState(false);
  const [inspSaving, setInspSaving] = useState(false);
  const [inspError, setInspError] = useState<string | null>(null);
  const [inspType, setInspType] = useState("");
  const [inspDate, setInspDate] = useState("");
  const [inspInspector, setInspInspector] = useState("");
  const [inspJobId, setInspJobId] = useState("");
  const [inspPermitId, setInspPermitId] = useState("");

  const resetPermitForm = () => {
    setPermitType("");
    setPermitJurisdiction("");
    setPermitJobId("");
    setPermitStatus("pending");
    setPermitError(null);
  };

  const resetInspForm = () => {
    setInspType("");
    setInspDate("");
    setInspInspector("");
    setInspJobId("");
    setInspPermitId("");
    setInspError(null);
  };

  const handleAddPermit = async () => {
    if (!permitType.trim()) {
      setPermitError("Permit type is required");
      return;
    }
    setPermitSaving(true);
    setPermitError(null);
    try {
      const res = await fetch("/api/permits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: permitType.trim(),
          jurisdiction: permitJurisdiction || null,
          jobId: permitJobId || null,
          status: permitStatus,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to create permit" }));
        setPermitError(err.error || "Failed to create permit");
        return;
      }
      resetPermitForm();
      setShowPermitForm(false);
      refetch();
    } catch {
      setPermitError("Network error");
    } finally {
      setPermitSaving(false);
    }
  };

  const handleScheduleInspection = async () => {
    if (!inspType.trim()) {
      setInspError("Inspection type is required");
      return;
    }
    setInspSaving(true);
    setInspError(null);
    try {
      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: inspType.trim(),
          scheduledDate: inspDate || null,
          inspector: inspInspector || null,
          jobId: inspJobId || null,
          permitId: inspPermitId || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to schedule inspection" }));
        setInspError(err.error || "Failed to schedule inspection");
        return;
      }
      resetInspForm();
      setShowInspForm(false);
      refetch();
    } catch {
      setInspError("Network error");
    } finally {
      setInspSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6" aria-busy={true}>
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-card" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <Card className="flex items-center gap-3 border-destructive/50 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </Card>
      </div>
    );
  }

  const safePermits = permits ?? [];
  const safeInspections = inspections ?? [];
  const safeJobs = jobs ?? [];

  const timelineItems = [
    ...safeInspections.map((i) => ({
      id: i.id,
      title: `${i.job?.title || "Unknown"} — ${i.type} Inspection ${i.status === "passed" ? "Passed" : i.status === "failed" ? "Failed" : "Scheduled"}`,
      subtitle: `${formatDate(i.completedDate || i.scheduledDate)}${i.inspector ? ` · Inspector: ${i.inspector}` : ""}`,
      dotColor: i.status === "passed" ? "bg-green-400" : i.status === "failed" ? "bg-red-400" : "bg-blue-400",
      date: new Date(i.completedDate || i.scheduledDate || 0),
    })),
    ...safePermits.map((p) => ({
      id: p.id,
      title: `${p.job?.title || "Unknown"} — Permit ${p.status === "approved" ? "Approved" : p.status === "in_review" ? "Submitted" : p.status}`,
      subtitle: `${formatDate(p.issuedDate)}${p.jurisdiction ? ` · ${p.jurisdiction}` : ""}`,
      dotColor: p.status === "approved" ? "bg-green-400" : p.status === "in_review" ? "bg-blue-400" : "bg-amber-400",
      date: new Date(p.issuedDate || p.expiryDate || 0),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Permits & Inspections</h1>
          <p className="text-sm text-muted-foreground">
            {safePermits.length} permits · {safeInspections.length} inspections
          </p>
        </div>
        <Button size="sm" onClick={() => { setShowPermitForm(!showPermitForm); resetPermitForm(); }}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add Permit
        </Button>
      </div>

      {showPermitForm && (
        <Card className="mb-4 p-4 space-y-3">
          <Input
            placeholder="Permit type *"
            value={permitType}
            onChange={(e) => setPermitType(e.target.value)}
            autoFocus
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              placeholder="Jurisdiction"
              value={permitJurisdiction}
              onChange={(e) => setPermitJurisdiction(e.target.value)}
            />
            <select
              value={permitJobId}
              onChange={(e) => setPermitJobId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select job...</option>
              {safeJobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </div>
          <select
            value={permitStatus}
            onChange={(e) => setPermitStatus(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {PERMIT_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
          {permitError && <p className="text-sm text-destructive">{permitError}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddPermit} disabled={permitSaving || !permitType.trim()}>
              {permitSaving ? "Saving..." : "Save Permit"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowPermitForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <Tabs defaultValue="permits" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="permits">Permits</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="permits" className="mt-4">
          <div className="space-y-2">
            {safePermits.map((permit) => (
              <Card key={permit.id} className="flex-row items-center gap-3 p-4">
                {permitIcon(permit.status)}
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {permit.job?.title || "Unknown Job"} — {permit.type}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {permit.jurisdiction} · {permit.expiryDate ? `Expires ${formatDate(permit.expiryDate)}` : permit.permitNumber || "Pending"}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={permit.status} />
                  <ExpiryBadge expiryDate={permit.expiryDate} />
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inspections" className="mt-4">
          <div className="mb-3">
            <Button size="sm" onClick={() => { setShowInspForm(!showInspForm); resetInspForm(); }}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Schedule Inspection
            </Button>
          </div>

          {showInspForm && (
            <Card className="mb-4 p-4 space-y-3">
              <Input
                placeholder="Inspection type *"
                value={inspType}
                onChange={(e) => setInspType(e.target.value)}
                autoFocus
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  type="date"
                  placeholder="Scheduled date"
                  value={inspDate}
                  onChange={(e) => setInspDate(e.target.value)}
                />
                <Input
                  placeholder="Inspector name"
                  value={inspInspector}
                  onChange={(e) => setInspInspector(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select
                  value={inspJobId}
                  onChange={(e) => setInspJobId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select job...</option>
                  {safeJobs.map((job) => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
                <select
                  value={inspPermitId}
                  onChange={(e) => setInspPermitId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select permit...</option>
                  {safePermits.map((p) => (
                    <option key={p.id} value={p.id}>{p.type} — {p.job?.title || "No job"}</option>
                  ))}
                </select>
              </div>
              {inspError && <p className="text-sm text-destructive">{inspError}</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleScheduleInspection} disabled={inspSaving || !inspType.trim()}>
                  {inspSaving ? "Saving..." : "Schedule"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowInspForm(false)}>
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          <div className="space-y-2">
            {safeInspections.map((insp) => (
              <Card key={insp.id} className="flex-row items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                  {inspectionIcon(insp.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {insp.job?.title || "Unknown"} — {insp.type}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {insp.status === "passed" || insp.status === "failed"
                      ? `${formatDate(insp.completedDate)}${insp.inspector ? ` · Inspector: ${insp.inspector}` : ""}`
                      : `Scheduled ${formatDate(insp.scheduledDate)}`}
                    {insp.notes && ` · ${insp.notes}`}
                  </div>
                </div>
                <StatusBadge status={insp.status} />
              </Card>
            ))}
          </div>
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
