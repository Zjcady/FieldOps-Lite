"use client";

import { useState } from "react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Package, Plus, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: string | number | null;
  totalCost: string | number | null;
  status: string;
  orderedDate: string | null;
  deliveryDate: string | null;
  job: { title: string; jobNumber: string };
  vendor: { name: string } | null;
}

interface Job {
  id: string;
  title: string;
}

interface Vendor {
  id: string;
  name: string;
}

const STATUSES = ["needed", "ordered", "delivered", "installed"] as const;

export default function MaterialsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const url =
    statusFilter === "all"
      ? "/api/materials"
      : `/api/materials?status=${statusFilter}`;
  const { data: materials, loading, error, refetch } = useFetch<Material[]>(url);
  const { data: jobs } = useFetch<Job[]>("/api/jobs");
  const { data: vendors } = useFetch<Vendor[]>("/api/vendors");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [jobId, setJobId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("each");
  const [unitCost, setUnitCost] = useState("");

  const resetForm = () => {
    setName("");
    setJobId("");
    setVendorId("");
    setQuantity("");
    setUnit("each");
    setUnitCost("");
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !jobId || !quantity || !unitCost) {
      setFormError("Name, job, quantity, and unit cost are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          jobId,
          vendorId: vendorId || undefined,
          quantity: parseFloat(quantity),
          unit,
          unitCost: parseFloat(unitCost),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to add material");
      }
      resetForm();
      setShowForm(false);
      refetch();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to add material");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/materials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refetch();
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Materials</h1>
          <p className="text-sm text-muted-foreground">
            Track materials across all jobs
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/materials/compare">
            <Button variant="outline" size="sm">
              Compare Prices
            </Button>
          </Link>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="mr-1 h-4 w-4" />
            Add Material
          </Button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("all")}
        >
          All
        </Button>
        {STATUSES.map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {/* Inline Add Form */}
      {showForm && (
        <Card className="mb-6 p-4">
          <h3 className="mb-3 text-sm font-semibold">New Material</h3>
          {formError && (
            <div className="mb-3 flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <Input
              placeholder="Material name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
            >
              <option value="">Select job...</option>
              {jobs?.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
            >
              <option value="">Select vendor (optional)</option>
              {vendors?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <Input
              placeholder="Unit (e.g., each, sqft)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Unit cost"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : "Add Material"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Error / Loading */}
      {error && (
        <Card className="p-6 text-center">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {loading && !materials && (
        <div className="flex justify-center p-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Materials Table */}
      {materials && materials.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-8 text-center">
          <Package className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            No materials found
          </p>
        </Card>
      )}

      {materials && materials.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left font-medium">Material</th>
                <th className="px-4 py-2 text-left font-medium">Job</th>
                <th className="px-4 py-2 text-left font-medium">Vendor</th>
                <th className="px-4 py-2 text-right font-medium">Qty</th>
                <th className="px-4 py-2 text-left font-medium">Unit</th>
                <th className="px-4 py-2 text-right font-medium">Unit Cost</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
                <th className="px-4 py-2 text-center font-medium">Status</th>
                <th className="px-4 py-2 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-medium">{m.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {m.job.title}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {m.vendor?.name ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-right">{m.quantity}</td>
                  <td className="px-4 py-2">{m.unit}</td>
                  <td className="px-4 py-2 text-right">
                    ${Number(m.unitCost ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    ${Number(m.totalCost ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <select
                      className="rounded border bg-background px-2 py-1 text-xs"
                      value={m.status}
                      onChange={(e) => updateStatus(m.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
