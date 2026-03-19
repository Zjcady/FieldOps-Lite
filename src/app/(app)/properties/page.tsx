"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Building2, Plus } from "lucide-react";
import { useFetch, safeMutate } from "@/lib/hooks/use-fetch";

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  customer: { name: string };
  _count: { jobs: number };
}

interface Customer {
  id: string;
  name: string;
}

export default function PropertiesPage() {
  const { data: properties, loading, error, refetch } = useFetch<Property[]>("/api/properties");
  const { data: customers } = useFetch<Customer[]>("/api/customers");
  const [showForm, setShowForm] = useState(false);
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formZip, setFormZip] = useState("");
  const [formCustomerId, setFormCustomerId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const { error: err } = await safeMutate("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: formAddress,
        city: formCity,
        state: formState,
        zip: formZip,
        customerId: formCustomerId,
      }),
    });
    setSubmitting(false);
    if (err) {
      setFormError(err);
      return;
    }
    setFormAddress("");
    setFormCity("");
    setFormState("");
    setFormZip("");
    setFormCustomerId("");
    setShowForm(false);
    refetch();
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-red-500/30 p-4">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Properties</h1>
          <p className="text-sm text-muted-foreground">
            {properties?.length ?? 0} properties
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Property
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4 p-4">
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Address"
                aria-label="Property address"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                required
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="text"
                placeholder="City"
                aria-label="City"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                required
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="text"
                placeholder="State"
                aria-label="State"
                value={formState}
                onChange={(e) => setFormState(e.target.value)}
                required
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="text"
                placeholder="ZIP"
                aria-label="ZIP code"
                value={formZip}
                onChange={(e) => setFormZip(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              value={formCustomerId}
              onChange={(e) => setFormCustomerId(e.target.value)}
              required
              aria-label="Customer"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select Customer</option>
              {(customers ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {formError && (
              <p className="text-sm text-red-400">{formError}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Adding..." : "Add Property"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-16 animate-pulse" />
          ))}
        </div>
      ) : (properties ?? []).length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 text-muted-foreground">
          <Building2 className="mb-2 h-8 w-8 opacity-20" />
          <p className="text-sm">No properties yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {(properties ?? []).map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">{p.address}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.city}, {p.state} {p.zip}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {p.customer.name} · {p._count.jobs} job{p._count.jobs !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
