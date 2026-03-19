"use client";

import { use, useState } from "react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { AlertCircle, ArrowLeft, Mail, Phone, User, Pencil, X, Check, Truck, Package } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const VENDOR_CATEGORIES = ["Materials", "Equipment", "Subcontractor", "Supplies", "Other"];

interface VendorMaterial {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  status: string;
  job: { title: string } | null;
}

interface VendorDetail {
  id: string;
  name: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
  materials: VendorMaterial[];
}

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: vendor, loading, error, refetch } = useFetch<VendorDetail>(`/api/vendors/${id}`);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const startEdit = () => {
    if (!vendor) return;
    setEditName(vendor.name);
    setEditContact(vendor.contact || "");
    setEditPhone(vendor.phone || "");
    setEditEmail(vendor.email || "");
    setEditCategory(vendor.category || "");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/vendors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          contact: editContact || null,
          phone: editPhone || null,
          email: editEmail || null,
          category: editCategory || null,
        }),
      });
      if (res.ok) {
        toast.success("Vendor updated!");
        setEditing(false);
        refetch();
      } else {
        toast.error("Failed to update vendor");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

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

  if (loading || !vendor) {
    return (
      <div className="p-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-card" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <Link href="/vendors" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Vendors
      </Link>

      {editing ? (
        <Card className="mb-4 p-4 space-y-3">
          <Input placeholder="Vendor name *" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input placeholder="Contact person" value={editContact} onChange={(e) => setEditContact(e.target.value)} />
            <Input placeholder="Phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input placeholder="Email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              aria-label="Vendor category"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select category...</option>
              {VENDOR_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
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
            <Truck className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold tracking-tight">{vendor.name}</h1>
            {vendor.category && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                {vendor.category}
              </span>
            )}
            <Button size="sm" variant="ghost" onClick={startEdit} className="h-7 w-7 p-0">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="mb-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {vendor.contact && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {vendor.contact}</span>}
            {vendor.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {vendor.email}</span>}
            {vendor.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {vendor.phone}</span>}
          </div>
        </>
      )}

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Materials ({vendor.materials.length})
      </h2>
      <div className="space-y-2">
        {vendor.materials.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No materials linked to this vendor.</p>
          </Card>
        ) : (
          vendor.materials.map((mat) => (
            <Card key={mat.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{mat.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {mat.job?.title || "Unknown Job"} &middot; {mat.quantity} {mat.unit}
                  </div>
                </div>
                <StatusBadge status={mat.status} />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
