"use client";

import { useFetch } from "@/lib/hooks/use-fetch";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { formatCurrency } from "@/lib/format";
import { AlertCircle, AlertTriangle, TrendingUp, TrendingDown, Clock, FileSpreadsheet, Receipt, BarChart3 } from "lucide-react";
import Link from "next/link";

interface FinanceData {
  revenue: { totalInvoiced: number; totalPaid: number; totalOutstanding: number };
  margins: {
    byJob: { title: string; customer: string; category: string | null; estimated: number; actual: number; margin: number; marginPct: number }[];
    byCategory: { name: string; revenue: number; cost: number; jobs: number; margin: number; marginPct: number }[];
  };
  bottlenecks: { type: string; count: number; severity: string }[];
  hours: { total: number; billable: number; utilization: number };
}

interface TrendMonth {
  month: string;
  revenue: number;
  cost: number;
}

interface TrendData {
  months: TrendMonth[];
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function FinancePage() {
  const { data, loading, error } = useFetch<FinanceData>("/api/finance/summary");
  const { data: trendData } = useFetch<TrendData>("/api/finance/trends");

  if (loading || !data) {
    return (
      <div className="p-4 md:p-6" aria-busy={true}>
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => <Card key={i} className="h-24 animate-pulse" />)}
        </div>
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

  const avgMargin = data.margins.byJob.length > 0
    ? data.margins.byJob.reduce((s, j) => s + j.marginPct, 0) / data.margins.byJob.length
    : 0;

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-1 text-lg font-semibold tracking-tight">Financial Overview</h1>
      <p className="mb-4 text-sm text-muted-foreground">Margin analysis and operational insights</p>

      <div className="mb-4 flex gap-2">
        <a href="/api/export?type=jobs&format=csv" download className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted">
          <FileSpreadsheet className="h-3.5 w-3.5" /> Export CSV
        </a>
        <Link href="/invoices" className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted">
          <Receipt className="h-3.5 w-3.5" /> Invoices
        </Link>
      </div>

      {/* Revenue metrics */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard value={formatCurrency(data.revenue.totalInvoiced)} label="Total Invoiced" valueColor="text-blue-400" borderColor="border-l-blue-400" />
        <MetricCard value={formatCurrency(data.revenue.totalPaid)} label="Collected" valueColor="text-green-400" borderColor="border-l-green-400" />
        <MetricCard value={formatCurrency(data.revenue.totalOutstanding)} label="Outstanding" valueColor="text-amber-400" borderColor="border-l-amber-400" />
        <MetricCard value={`${avgMargin.toFixed(1)}%`} label="Avg Margin" valueColor={avgMargin >= 20 ? "text-green-400" : "text-red-400"} borderColor={avgMargin >= 20 ? "border-l-green-400" : "border-l-red-400"} />
      </div>

      {/* Revenue Trend */}
      {trendData && trendData.months.length > 0 && (() => {
        const maxRevenue = Math.max(...trendData.months.map((m) => m.revenue), 1);
        return (
          <>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Revenue Trend
            </h2>
            <Card className="mb-6 p-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-semibold">Last 6 Months</h3>
              </div>
              <div className="flex items-end gap-2" style={{ height: 160 }}>
                {trendData.months.map((m) => {
                  const [, mo] = m.month.split("-");
                  const label = MONTH_NAMES[parseInt(mo, 10) - 1];
                  const heightPct = (m.revenue / maxRevenue) * 100;
                  return (
                    <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {formatCurrency(m.revenue)}
                      </span>
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className="w-full rounded-t bg-blue-500"
                          style={{ height: `${Math.max(heightPct, 2)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        );
      })()}

      {/* Bottlenecks */}
      {data.bottlenecks.length > 0 && (
        <>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Operational Bottlenecks
          </h2>
          <div className="mb-6 space-y-2">
            {data.bottlenecks.map((b) => (
              <Card key={b.type} className={`border-l-[3px] p-3 ${b.severity === "high" ? "border-l-red-500" : "border-l-amber-500"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${b.severity === "high" ? "text-red-400" : "text-amber-400"}`} />
                    <span className="text-sm font-medium">{b.type}</span>
                  </div>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">{b.count} job{b.count > 1 ? "s" : ""}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Category performance */}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Margin by Category
      </h2>
      <div className="mb-6 space-y-2">
        {data.margins.byCategory.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">No category data yet.</Card>
        )}
        {data.margins.byCategory.map((cat) => (
          <Card key={cat.name} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{cat.name}</div>
                <div className="text-xs text-muted-foreground">{cat.jobs} jobs · {formatCurrency(cat.revenue)} revenue</div>
              </div>
              <div className="flex items-center gap-1.5">
                {cat.marginPct >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span className={`text-sm font-bold ${cat.marginPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {cat.marginPct.toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Job margins */}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Job Margin Detail
      </h2>
      <div className="mb-6 space-y-2">
        {data.margins.byJob.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">No job margin data yet.</Card>
        )}
        {data.margins.byJob.map((job) => (
          <Card key={job.title} className="p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium">{job.title}</div>
                <div className="text-xs text-muted-foreground">{job.customer} · {job.category || "Other"}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Est: {formatCurrency(job.estimated)} · Actual: {formatCurrency(job.actual)}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${job.margin >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {job.margin >= 0 ? "+" : ""}{formatCurrency(job.margin)}
                </div>
                <div className={`text-xs ${job.marginPct >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {job.marginPct.toFixed(1)}%
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Hours utilization */}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Time Utilization
      </h2>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-blue-400" />
          <div>
            <div className="text-sm font-medium">{data.hours.billable.toFixed(1)} / {data.hours.total.toFixed(1)} hours billable</div>
            <div className="text-xs text-muted-foreground">{data.hours.utilization.toFixed(1)}% utilization rate</div>
          </div>
        </div>
        {data.hours.total > 0 && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${data.hours.utilization}%` }} />
          </div>
        )}
      </Card>
    </div>
  );
}
