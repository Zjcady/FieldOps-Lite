"use client";

import { use } from "react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { AlertCircle, ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";

interface CustomerDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  properties: { id: string; address: string; city: string; state: string }[];
  jobs: { id: string; title: string; status: string; jobNumber: string }[];
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: customer, loading, error } = useFetch<CustomerDetail>(`/api/customers/${id}`);

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

  return (
    <div className="p-4 md:p-6">
      <Link href="/customers" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Link>

      <h1 className="mb-1 text-lg font-semibold tracking-tight">{customer.name}</h1>
      <div className="mb-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
        {customer.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {customer.email}</span>}
        {customer.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {customer.phone}</span>}
        {customer.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {customer.address}</span>}
      </div>

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
