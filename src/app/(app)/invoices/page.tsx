"use client";

import { Card } from "@/components/ui/card";
import { useFetch } from "@/lib/hooks/use-fetch";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { AlertCircle, Receipt } from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  dueDate: string | null;
  paidDate: string | null;
  job: { title: string; jobNumber: string };
}

export default function InvoicesPage() {
  const { data: invoices, loading, error } = useFetch<Invoice[]>("/api/invoices");

  if (error) return (<div className="p-4"><Card className="border-red-500/30 p-4"><div className="flex items-center gap-2 text-sm text-red-400"><AlertCircle className="h-4 w-4" />{error}</div></Card></div>);

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-1 text-lg font-semibold tracking-tight">Invoices</h1>
      <p className="mb-4 text-sm text-muted-foreground">{invoices?.length ?? 0} invoices</p>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="h-20 animate-pulse" />)}</div>
      ) : (invoices ?? []).length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-8 text-muted-foreground">
          <Receipt className="mb-2 h-8 w-8 opacity-20" />
          <p className="text-sm">No invoices yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {(invoices ?? []).map((inv) => (
            <Card key={inv.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">{inv.invoiceNumber}</div>
                  <div className="text-xs text-muted-foreground">{inv.job.title} · {inv.job.jobNumber}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {inv.dueDate ? `Due ${formatDate(inv.dueDate)}` : "No due date"}
                    {inv.paidDate && ` · Paid ${formatDate(inv.paidDate)}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{formatCurrency(inv.total)}</div>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
