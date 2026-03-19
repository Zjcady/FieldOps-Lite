"use client";

import { useState } from "react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Plus, Send, Mail, Users, Eye } from "lucide-react";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  template: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  stats: { total: number; sent: number; opened: number };
  _count: { recipients: number };
}

const TEMPLATES = [
  { id: "seasonal_discount", label: "Seasonal Discount", subject: "Spring special — 15% off landscaping!" },
  { id: "followup", label: "Follow-up", subject: "How are things looking?" },
  { id: "referral", label: "Referral Request", subject: "Know someone who needs landscaping?" },
  { id: "maintenance_reminder", label: "Maintenance Reminder", subject: "Time for your seasonal maintenance!" },
  { id: "general", label: "General", subject: "" },
];

export default function OutreachPage() {
  const { data: campaigns, loading, error, refetch } = useFetch<Campaign[]>("/api/outreach/campaigns");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  const handleSend = async (campaignId: string) => {
    setSending(campaignId);
    try {
      const res = await fetch(`/api/outreach/campaigns/${campaignId}/send`, { method: "POST" });
      if (res.ok) {
        toast.success("Campaign sent!");
        refetch();
      } else {
        toast.error("Failed to send campaign");
      }
    } catch { toast.error("Network error"); }
    finally { setSending(null); }
  };
  const [form, setForm] = useState({ name: "", subject: "", body: "", template: "general", filter: "all" });

  const handleCreate = async () => {
    if (!form.name || !form.subject) return;
    setCreating(true);
    try {
      const res = await fetch("/api/outreach/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const campaign = await res.json();
        setShowCreate(false);
        setForm({ name: "", subject: "", body: "", template: "general", filter: "all" });
        toast.success(`Campaign created with ${campaign._count.recipients} recipients!`);
        refetch();
      }
    } catch {
      toast.error("Network error");
    } finally {
      setCreating(false);
    }
  };

  const selectTemplate = (templateId: string) => {
    const tpl = TEMPLATES.find((t) => t.id === templateId);
    setForm((f) => ({ ...f, template: templateId, subject: tpl?.subject || f.subject }));
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Customer Outreach</h1>
          <p className="text-sm text-muted-foreground">{(campaigns ?? []).length} campaigns</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-1 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-4 p-4 space-y-3">
          <Input placeholder="Campaign name *" aria-label="Campaign name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} autoFocus />

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Template</label>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selectTemplate(t.id)}
                  aria-pressed={form.template === t.id}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    form.template === t.id ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Input placeholder="Email subject *" aria-label="Email subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          <textarea
            placeholder="Email body..."
            aria-label="Email body"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          />

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Send to</label>
            <div className="flex gap-2">
              {[
                { v: "all", l: "All Customers" },
                { v: "past", l: "Past Customers" },
                { v: "active", l: "Active Customers" },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setForm((f) => ({ ...f, filter: opt.v }))}
                  aria-pressed={form.filter === opt.v}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    form.filter === opt.v ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={creating || !form.name || !form.subject}>Create Draft</Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Card key={i} className="h-20 animate-pulse" />)}</div>
      ) : error ? (
        <Card className="flex items-center gap-3 border-destructive/50 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </Card>
      ) : (campaigns ?? []).length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 text-muted-foreground">
          <Mail className="mb-2 h-8 w-8 opacity-20" />
          <p className="text-sm">No campaigns yet. Create one to reach your customers.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {(campaigns ?? []).map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold">{c.name}</h3>
                  <div className="text-xs text-muted-foreground">{c.subject}</div>
                  <div className="mt-1.5 flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.stats.total} recipients</span>
                    <span className="flex items-center gap-1"><Send className="h-3 w-3" />{c.stats.sent} sent</span>
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{c.stats.opened} opened</span>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  c.status === "sent" ? "bg-green-500/15 text-green-400" : "bg-secondary text-muted-foreground"
                }`}>
                  {c.status}
                </span>
              </div>
              {c.status === "draft" && (
                <div className="mt-2 flex gap-2">
                  <Button size="xs" variant="outline" onClick={() => setPreviewCampaign(c)}>Preview</Button>
                  <Button size="xs" onClick={() => handleSend(c.id)} disabled={sending === c.id}>
                    {sending === c.id ? "Sending..." : "Send"}
                  </Button>
                </div>
              )}
              <div className="mt-2 text-[11px] text-muted-foreground">
                {c.sentAt ? `Sent ${formatDate(c.sentAt)}` : `Created ${formatDate(c.createdAt)}`}
              </div>
            </Card>
          ))}
        </div>
      )}

      {previewCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-label="Email preview" onClick={() => setPreviewCampaign(null)} onKeyDown={(e) => { if (e.key === "Escape") setPreviewCampaign(null); }}>
          <Card className="max-h-[80vh] w-full max-w-md overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Email Preview</h3>
              <button onClick={() => setPreviewCampaign(null)} aria-label="Close preview" className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="text-xs text-muted-foreground">Subject:</div>
              <div className="text-sm font-medium">{previewCampaign.subject}</div>
              <div className="border-t border-border pt-3 text-sm whitespace-pre-wrap">{previewCampaign.body || "(No body content)"}</div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">{previewCampaign.stats.total} recipients</div>
          </Card>
        </div>
      )}
    </div>
  );
}
