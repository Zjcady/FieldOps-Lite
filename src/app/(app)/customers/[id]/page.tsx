"use client";

import { use, useState } from "react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { AlertCircle, Mail, Phone, MapPin, Pencil, X, Check, DollarSign, Share2, Link2, Star, MessageSquare, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency, formatRelative } from "@/lib/format";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

interface PortalMessage {
  id: string;
  senderType: string;
  content: string;
  createdAt: string;
}

interface CustomerDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  portalToken: string | null;
  properties: { id: string; address: string; city: string; state: string }[];
  jobs: { id: string; title: string; status: string; jobNumber: string; estimatedCost: number | null }[];
  messages: PortalMessage[];
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: customer, loading, error, refetch } = useFetch<CustomerDetail>(`/api/customers/${id}`);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [generatingPortal, setGeneratingPortal] = useState(false);
  const [referralSource, setReferralSource] = useState("");
  const [savingReferral, setSavingReferral] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const startEdit = () => {
    if (!customer) return;
    setEditName(customer.name);
    setEditEmail(customer.email || "");
    setEditPhone(customer.phone || "");
    setEditAddress(customer.address || "");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail || null,
          phone: editPhone || null,
          address: editAddress || null,
        }),
      });
      if (res.ok) {
        toast.success("Customer updated!");
        setEditing(false);
        refetch();
      } else {
        toast.error("Failed to update customer");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleSharePortal = async () => {
    if (!customer) return;
    if (customer.portalToken) {
      const link = `${window.location.origin}/portal/${customer.portalToken}`;
      try {
        await navigator.clipboard.writeText(link);
        toast.success("Portal link copied!");
      } catch {
        toast.warning("Could not copy to clipboard");
      }
    } else {
      setGeneratingPortal(true);
      try {
        const res = await fetch(`/api/customers/${id}/portal-token`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          const link = `${window.location.origin}/portal/${data.portalToken}`;
          await navigator.clipboard.writeText(link);
          toast.success("Portal link copied!");
          refetch();
        } else {
          toast.error("Failed to generate portal link");
        }
      } catch {
        toast.error("Network error");
      } finally {
        setGeneratingPortal(false);
      }
    }
  };

  const handleSaveReferral = async () => {
    if (!referralSource.trim()) return;
    setSavingReferral(true);
    try {
      // Store referral info as a portal message note
      const token = customer?.portalToken;
      if (token) {
        await fetch(`/api/portal/${token}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderType: "system",
            content: `Referral source: ${referralSource.trim()}`,
          }),
        });
      }
      toast.success("Referral source saved!");
      setReferralSource("");
      refetch();
    } catch {
      toast.error("Failed to save referral");
    } finally {
      setSavingReferral(false);
    }
  };

  const sendReply = async () => {
    const content = replyContent.trim();
    if (!content) return;
    setSendingReply(true);
    try {
      const res = await fetch(`/api/customers/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        setReplyContent("");
        toast.success("Reply sent!");
        refetch();
      } else {
        toast.error("Failed to send");
      }
    } catch { toast.error("Network error"); }
    finally { setSendingReply(false); }
  };

  if (loading || !customer) {
    return (
      <div className="p-4">
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

  // Satisfaction calculations
  const totalJobs = customer.jobs.length;
  const completedJobs = customer.jobs.filter((j) => j.status === "completed");
  const completionPct = totalJobs > 0 ? (completedJobs.length / totalJobs) * 100 : 0;
  const totalRevenue = completedJobs.reduce((sum, j) => sum + (Number(j.estimatedCost) || 0), 0);
  const avgJobValue = completedJobs.length > 0 ? totalRevenue / completedJobs.length : 0;
  const satisfactionEmoji = completionPct > 80 ? "\u{1F60A}" : completionPct >= 50 ? "\u{1F610}" : "\u{1F61E}";

  return (
    <div className="p-4 md:p-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Customers", href: "/customers" }, { label: customer.name }]} />

      {editing ? (
        <Card className="mb-4 p-4 space-y-3">
          <Input placeholder="Customer name *" aria-label="Customer name" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Email" type="email" aria-label="Customer email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            <Input placeholder="Phone" aria-label="Customer phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
          </div>
          <Input placeholder="Address" aria-label="Customer address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={saveEdit} disabled={saving || !editName.trim()}>
              <Check className="mr-1 h-3.5 w-3.5" /> Save
            </Button>
            <Button size="sm" variant="outline" onClick={cancelEdit}>
              <X className="mr-1 h-3.5 w-3.5" /> Cancel
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">{customer.name}</h1>
            <Button size="sm" variant="ghost" onClick={startEdit} className="h-7 w-7 p-0" aria-label="Edit customer">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {/* Feature 23: Quick email button */}
            {customer.email && (
              <a href={`mailto:${customer.email}?subject=FieldOps Update`}>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Send Email">
                  <Mail className="h-3.5 w-3.5" />
                </Button>
              </a>
            )}
          </div>
          <div className="mb-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {customer.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {customer.email}</span>}
            {customer.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {customer.phone}</span>}
            {customer.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {customer.address}</span>}
          </div>
        </>
      )}

      {/* Feature 17: Portal share button */}
      <div className="mb-4">
        <Button size="sm" variant="outline" onClick={handleSharePortal} disabled={generatingPortal}>
          {customer.portalToken ? (
            <>
              <Share2 className="mr-1 h-3.5 w-3.5" /> Share Portal Link
            </>
          ) : (
            <>
              <Link2 className="mr-1 h-3.5 w-3.5" /> {generatingPortal ? "Generating..." : "Generate Portal Link"}
            </>
          )}
        </Button>
      </div>

      {/* Lifetime Value */}
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="h-4 w-4 text-green-400" />
          <h3 className="text-sm font-semibold">Lifetime Value</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">{formatCurrency(totalRevenue)}</div>
            <div className="text-[10px] text-muted-foreground">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-400">{completedJobs.length}</div>
            <div className="text-[10px] text-muted-foreground">Completed Jobs</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-400">{formatCurrency(avgJobValue)}</div>
            <div className="text-[10px] text-muted-foreground">Avg Job Value</div>
          </div>
        </div>
      </Card>

      {/* Feature 20: Referral tracking */}
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-purple-400" />
          <h3 className="text-sm font-semibold">Referrals</h3>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Referred by: <span className="text-foreground">(none)</span></p>
          <p>Has referred: <span className="text-foreground">(none)</span></p>
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Enter referral source (customer name)"
            aria-label="Referral source"
            value={referralSource}
            onChange={(e) => setReferralSource(e.target.value)}
            className="h-8 text-sm"
          />
          <Button size="sm" onClick={handleSaveReferral} disabled={savingReferral || !referralSource.trim()}>
            Save
          </Button>
        </div>
      </Card>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Jobs ({customer.jobs.length})
      </h2>
      <div className="mb-6 space-y-2">
        {customer.jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No jobs yet.</p>
        ) : (
          customer.jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="cursor-pointer p-3 transition-all hover:border-primary/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{job.title}</div>
                    <div className="text-xs text-muted-foreground">{job.jobNumber}</div>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Feature 21: Satisfaction indicator */}
      {totalJobs > 0 && (
        <Card className="mb-6 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-yellow-400" />
            <h3 className="text-sm font-semibold">Satisfaction</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold">{completionPct.toFixed(0)}%</div>
              <div className="text-[10px] text-muted-foreground">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{formatCurrency(avgJobValue)}</div>
              <div className="text-[10px] text-muted-foreground">Avg Job Margin</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">{satisfactionEmoji}</div>
              <div className="text-[10px] text-muted-foreground">Indicator</div>
            </div>
          </div>
        </Card>
      )}

      {/* Feature 22: Customer communication log */}
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold">Recent Communications</h3>
        </div>
        {(!customer.messages || customer.messages.length === 0) ? (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          <div className="space-y-2">
            {customer.messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2 text-sm">
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  msg.senderType === "customer" ? "bg-blue-500/15 text-blue-400" : "bg-secondary text-muted-foreground"
                }`}>
                  {msg.senderType}
                </span>
                <span className="flex-1 text-muted-foreground truncate">
                  {msg.content.length > 100 ? msg.content.substring(0, 100) + "..." : msg.content}
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {formatRelative(msg.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
        {/* Contractor reply form */}
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Reply to customer..."
            aria-label="Reply to customer"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendReply(); }}
            disabled={sendingReply}
          />
          <Button size="sm" onClick={sendReply} disabled={sendingReply || !replyContent.trim()}>
            {sendingReply ? "Sending..." : "Send"}
          </Button>
        </div>
      </Card>

      {customer.properties.length > 0 && (
        <>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Properties ({customer.properties.length})
          </h2>
          <div className="space-y-2">
            {customer.properties.map((p) => (
              <Card key={p.id} className="p-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {p.address}, {p.city} {p.state}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
