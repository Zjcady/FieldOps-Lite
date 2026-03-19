"use client";

import { useState } from "react";
import Link from "next/link";
import { useFetch } from "@/lib/hooks/use-fetch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Plus, Truck, Mail, Phone, User } from "lucide-react";

interface Vendor {
  id: string;
  name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
  _count: { materials: number };
}

const VENDOR_CATEGORIES = ["Materials", "Equipment", "Subcontractor", "Supplies", "Other"];

export default function VendorsPage() {
  const { data: vendors, loading, error, refetch } = useFetch<Vendor[]>("/api/vendors");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");

  const resetForm = () => {
    setName("");
    setContact("");
    setPhone("");
    setEmail("");
    setCategory("");
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setFormError("Vendor name is required");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact || undefined,
          phone: phone || undefined,
          email: email || undefined,
          category: category || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to create vendor" }));
        setFormError(err.error || "Failed to create vendor");
        return;
      }
      resetForm();
      setShowForm(false);
      refetch();
    } catch {
      setFormError("Network error");
    } finally {
      setSaving(false);
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

  const safeVendors = vendors ?? [];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Vendors</h1>
          <p className="text-sm text-muted-foreground">{safeVendors.length} vendors</p>
        </div>
        <Button size="sm" onClick={() => { setShowForm(!showForm); resetForm(); }}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Add Vendor
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4 p-4 space-y-3">
          <Input
            placeholder="Vendor name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input placeholder="Contact person" value={contact} onChange={(e) => setContact(e.target.value)} />
            <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select category...</option>
              {VENDOR_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={saving || !name.trim()}>
              {saving ? "Saving..." : "Save Vendor"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {safeVendors.length === 0 && !showForm ? (
          <Card className="p-8 text-center">
            <Truck className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No vendors yet. Add your first vendor to get started.</p>
          </Card>
        ) : (
          safeVendors.map((vendor) => (
            <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
              <Card className="cursor-pointer p-4 transition-all hover:border-primary/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{vendor.name}</span>
                      {vendor.category && (
                        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                          {vendor.category}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {vendor.contact && (
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {vendor.contact}</span>
                      )}
                      {vendor.phone && (
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {vendor.phone}</span>
                      )}
                      {vendor.email && (
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {vendor.email}</span>
                      )}
                      <span>{vendor._count.materials} material{vendor._count.materials !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
