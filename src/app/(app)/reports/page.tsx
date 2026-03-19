"use client";

import { useState } from "react";
import { useFetch } from "@/lib/hooks/use-fetch";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { formatCurrency, formatDate } from "@/lib/format";
import Link from "next/link";
import { AlertCircle, FileSpreadsheet, TrendingUp, Link2, Package, Timer } from "lucide-react";

interface RevenueData {
  revenueByCategory: { name: string; value: number }[];
  totalPaid: number;
  totalOutstanding: number;
  totalRevenue: number;
}

interface VelocityCategory {
  name: string;
  avgDays: number;
  count: number;
}

interface VelocityData {
  categories: VelocityCategory[];
}

interface CustomerWithPortal {
  id: string;
  name: string;
  portalToken: string | null;
  jobs: { id: string; title: string; progress: number; estimatedEnd: string | null; _count?: { photos: number } }[];
}

const BAR_COLORS: Record<string, string> = {
  Hardscape: "bg-blue-500",
  Maintenance: "bg-green-500",
  Fencing: "bg-purple-400",
  Lanai: "bg-amber-500",
  Landscaping: "bg-emerald-500",
  Lighting: "bg-cyan-400",
  Other: "bg-slate-400",
};

const currentMonth = new Date().toLocaleDateString("en-US", { month: "long" });

export default function ReportsPage() {
  const { data, loading, error } = useFetch<RevenueData>("/api/reports/revenue");
  const { data: velocityData } = useFetch<VelocityData>("/api/reports/velocity");
  const { data: customers } = useFetch<CustomerWithPortal[]>("/api/customers");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  if (loading || !data) {
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

  const maxVal = Math.max(...data.revenueByCategory.map((d) => d.value), 1);

  // Find customers with portal tokens for the portal preview
  const portalCustomers = (customers ?? []).filter((c) => c.portalToken);
  const selectedCustomer = selectedCustomerId
    ? portalCustomers.find((c) => c.id === selectedCustomerId)
    : portalCustomers[0];
  const selectedJob = selectedCustomer?.jobs?.[0];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold tracking-tight">Reports & More</h1>
      </div>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Monthly Performance
      </h2>

      <Card className="mb-6 p-4">
        <h3 className="mb-4 text-sm font-semibold">Revenue by Category — {currentMonth}</h3>
        <div className="space-y-3">
          {data.revenueByCategory.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No revenue data for this period.</p>
          )}
          {data.revenueByCategory.map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{item.name}</span>
                <span className="font-semibold" style={{ color: `var(--chart-1)` }}>
                  {formatCurrency(item.value)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full rounded-full ${BAR_COLORS[item.name] || "bg-blue-500"}`}
                  style={{ width: `${(item.value / maxVal) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Completion Velocity */}
      {velocityData && velocityData.categories.length > 0 && (() => {
        const maxDays = Math.max(...velocityData.categories.map((c) => c.avgDays), 1);
        return (
          <Card className="mb-6 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Timer className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-semibold">Completion Velocity</h3>
            </div>
            <div className="space-y-3">
              {velocityData.categories.map((cat) => {
                const widthPct = (cat.avgDays / maxDays) * 100;
                return (
                  <div key={cat.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{cat.name}</span>
                      <span className="font-semibold text-purple-400">
                        {cat.avgDays}d avg <span className="text-muted-foreground font-normal">({cat.count} jobs)</span>
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-purple-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })()}

      <div className="mb-6 grid grid-cols-2 gap-3">
        <MetricCard
          value={formatCurrency(data.totalRevenue)}
          label="Total Revenue"
          valueColor="text-green-400"
          borderColor="border-l-green-400"
        />
        <MetricCard
          value={formatCurrency(data.totalOutstanding)}
          label="Outstanding"
          valueColor="text-amber-400"
          borderColor="border-l-amber-400"
        />
      </div>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Quick Actions
      </h2>
      <div className="mb-6 grid grid-cols-2 gap-3">
        {[
          { icon: FileSpreadsheet, title: "QuickBooks Export", sub: "CSV ready", href: "/api/export?type=jobs&format=csv", color: "bg-green-500/15 text-green-400" },
          { icon: TrendingUp, title: "Power BI Export", sub: "Analytics tables", href: "/api/export?type=jobs&format=json", color: "bg-blue-500/15 text-blue-400" },
          { icon: Link2, title: "Customer Portal", sub: "Share project link", href: selectedCustomer?.portalToken ? `/portal/${selectedCustomer.portalToken}` : "/customers", color: "bg-purple-500/15 text-purple-400" },
          { icon: Package, title: "Material Orders", sub: "Compare vendors", href: "/materials/compare", color: "bg-amber-500/15 text-amber-400" },
        ].map((action) => {
          const IconComp = action.icon;
          const content = (
            <Card key={action.title} className="cursor-pointer p-5 text-center transition-all hover:border-primary/30 hover:translate-y-[-1px]">
              <div className={`mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl ${action.color}`}>
                <IconComp className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold">{action.title}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{action.sub}</div>
            </Card>
          );
          return action.href ? (
            <Link key={action.title} href={action.href}>{content}</Link>
          ) : (
            <div key={action.title}>{content}</div>
          );
        })}
      </div>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Customer Portal Preview
      </h2>

      {portalCustomers.length > 0 ? (
        <>
          {/* Customer selector */}
          {portalCustomers.length > 1 && (
            <select
              value={selectedCustomerId || selectedCustomer?.id || ""}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              aria-label="Select customer for portal preview"
              className="mb-3 flex h-8 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {portalCustomers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {selectedCustomer && (
            <Link href={`/portal/${selectedCustomer.portalToken}`}>
              <Card className="cursor-pointer border-primary/20 bg-gradient-to-br from-blue-500/10 to-purple-500/5 p-5 text-center transition-colors hover:border-primary/40">
                <div className="mb-1 text-xs text-muted-foreground">
                  {selectedCustomer.name} — Shareable project link
                </div>
                <div className="font-mono text-sm text-muted-foreground">
                  /portal/{selectedCustomer.portalToken}
                </div>
                {selectedJob ? (
                  <div className="mt-3 flex justify-center gap-6">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-400">{selectedJob.progress}%</div>
                      <div className="text-[10px] text-muted-foreground">Complete</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-400">{selectedJob.title.split(" ").slice(0, 2).join(" ")}</div>
                      <div className="text-[10px] text-muted-foreground">Active Job</div>
                    </div>
                    {selectedJob.estimatedEnd && (
                      <div className="text-center">
                        <div className="text-xl font-bold text-amber-400">{formatDate(selectedJob.estimatedEnd).replace(/, \d{4}$/, "")}</div>
                        <div className="text-[10px] text-muted-foreground">Est. Done</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 text-xs text-muted-foreground">No active jobs</div>
                )}
                <div className="mt-3 text-xs text-primary">Tap to preview portal →</div>
              </Card>
            </Link>
          )}
        </>
      ) : (
        <Card className="p-5 text-center">
          <div className="text-sm text-muted-foreground">
            No customers have portal tokens yet. Generate one from a customer&apos;s detail page.
          </div>
          <Link href="/customers" className="mt-2 inline-block text-xs text-primary">
            Go to Customers →
          </Link>
        </Card>
      )}
    </div>
  );
}
