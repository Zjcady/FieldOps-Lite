"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Bell, FileText, DollarSign } from "lucide-react";
import { JOB_CATEGORIES } from "@/lib/constants";
import { toast } from "sonner";
import Link from "next/link";

interface CompanyInfo {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  slug: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    async function fetchCompany() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Failed to load settings");
        const data = await res.json();
        setCompany(data);
        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
      } catch {
        setFetchError("Failed to load company settings");
      } finally {
        setLoading(false);
      }
    }
    fetchCompany();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Company name is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, address }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Save failed" }));
        toast.error(err.error || "Save failed");
        return;
      }
      const updated = await res.json();
      setCompany(updated);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-card" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-4 md:p-6">
        <Card className="border-red-500/30 p-4">
          <p className="text-sm text-red-400">{fetchError}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your company profile and preferences
        </p>
      </div>

      <form onSubmit={handleSave} className="max-w-lg space-y-4">
        <Card className="p-4 space-y-4">
          <h2 className="text-sm font-semibold">Company Information</h2>
          {company?.slug && (
            <p className="text-xs text-muted-foreground">
              Slug: {company.slug}
            </p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="company-name" className="text-xs font-medium text-muted-foreground">
              Company Name *
            </label>
            <Input
              id="company-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Company name"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="company-email" className="text-xs font-medium text-muted-foreground">
              Email
            </label>
            <Input
              id="company-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@company.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="company-phone" className="text-xs font-medium text-muted-foreground">
              Phone
            </label>
            <Input
              id="company-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="company-address" className="text-xs font-medium text-muted-foreground">
              Address
            </label>
            <Input
              id="company-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, ST 12345"
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </Card>
      </form>

      <div className="mt-4 max-w-lg space-y-4">
        <LaborRatesSection />
        <PricingTemplatesSection />

        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold">Quick Links</h2>
          <div className="space-y-2">
            <Link
              href="/settings/notifications"
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              Notification Preferences
            </Link>
            <Link
              href="/docs"
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              API Documentation
            </Link>
          </div>
        </Card>

        <Card className="border-red-500/30 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
          <p className="text-xs text-muted-foreground">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          <Button variant="destructive" size="sm" disabled>
            Delete Account
          </Button>
        </Card>
      </div>
    </div>
  );
}

function LaborRatesSection() {
  const [rates, setRates] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/settings/labor-rates")
      .then((r) => r.ok ? r.json() : [])
      .then((data: Array<{ category: string; ratePerHour: number }>) => {
        const map: Record<string, string> = {};
        data.forEach((r) => { map[r.category] = String(r.ratePerHour); });
        setRates(map);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const body = Object.entries(rates).map(([category, rate]) => ({
      category,
      ratePerHour: parseFloat(rate) || 0,
    }));
    const res = await fetch("/api/settings/labor-rates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) toast.success("Labor rates saved");
    else toast.error("Failed to save rates");
  };

  if (!loaded) return null;

  return (
    <Card className="p-4 space-y-3">
      <h2 className="text-sm font-semibold flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-muted-foreground" />
        Labor Rates
      </h2>
      <p className="text-xs text-muted-foreground">Set hourly rates per job category for cost calculations.</p>
      <div className="space-y-2">
        {JOB_CATEGORIES.map((cat) => (
          <div key={cat} className="flex items-center gap-3">
            <span className="w-28 text-xs text-muted-foreground">{cat}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">$</span>
              <Input
                type="number"
                step="0.50"
                min="0"
                className="w-24 h-8 text-sm"
                value={rates[cat] ?? "45"}
                onChange={(e) => setRates((prev) => ({ ...prev, [cat]: e.target.value }))}
              />
              <span className="text-xs text-muted-foreground">/hr</span>
            </div>
          </div>
        ))}
      </div>
      <Button size="sm" onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
        Save Rates
      </Button>
    </Card>
  );
}

interface PTemplate {
  id: string;
  name: string;
  category: string;
  unit: string;
  ratePerUnit: number;
  materialCostPerUnit: number;
  laborHoursPerUnit: number;
}

function PricingTemplatesSection() {
  const [templates, setTemplates] = useState<PTemplate[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/settings/pricing-templates")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setTemplates(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  const grouped = templates.reduce<Record<string, PTemplate[]>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  return (
    <Card className="p-4 space-y-3">
      <h2 className="text-sm font-semibold">Pricing Templates</h2>
      <p className="text-xs text-muted-foreground">Pre-configured rates for the job cost calculator.</p>

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{category}</h3>
          <div className="space-y-1">
            {items.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded px-2 py-1 text-xs hover:bg-muted/50">
                <span>{t.name}</span>
                <span className="text-muted-foreground">
                  ${Number(t.ratePerUnit)}/{t.unit} · mat ${Number(t.materialCostPerUnit)} · {t.laborHoursPerUnit} hrs/{t.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {templates.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No templates configured yet. They will be created when you seed your database.</p>
      )}
    </Card>
  );
}
