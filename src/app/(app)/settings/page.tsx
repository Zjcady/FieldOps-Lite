"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
        toast.error("Failed to load company settings");
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
            <label className="text-xs font-medium text-muted-foreground">
              Company Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Company name"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@company.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Phone
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Address
            </label>
            <Input
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
      </form>
    </div>
  );
}
