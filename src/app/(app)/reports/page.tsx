"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";

interface RevenueData {
  revenueByCategory: { name: string; value: number }[];
  totalPaid: number;
  totalOutstanding: number;
  totalRevenue: number;
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

export default function ReportsPage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/revenue")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading || !data) {
    return (
      <div className="p-4 md:p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-card" />
      </div>
    );
  }

  const maxVal = Math.max(...data.revenueByCategory.map((d) => d.value), 1);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold tracking-tight">Reports & More</h1>
      </div>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Monthly Performance
      </h2>

      <Card className="mb-6 p-4">
        <h3 className="mb-4 text-sm font-semibold">Revenue by Category — March</h3>
        <div className="space-y-3">
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

      <div className="mb-6 grid grid-cols-2 gap-3">
        <MetricCard
          value={formatCurrency(data.totalRevenue)}
          label="Total Revenue"
          valueColor="text-green-400"
        />
        <MetricCard
          value={formatCurrency(data.totalOutstanding)}
          label="Outstanding"
          valueColor="text-amber-400"
        />
      </div>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Quick Actions
      </h2>
      <div className="mb-6 grid grid-cols-2 gap-3">
        {[
          { icon: "📊", title: "QuickBooks Export", sub: "CSV ready" },
          { icon: "📈", title: "Power BI Export", sub: "Analytics tables" },
          { icon: "🔗", title: "Customer Portal", sub: "Share project link", href: "/portal/mrt-x7f2k9" },
          { icon: "📦", title: "Material Orders", sub: "Compare vendors" },
        ].map((action) => (
          action.href ? (
            <Link key={action.title} href={action.href}>
              <Card className="cursor-pointer p-5 text-center transition-colors hover:border-primary/30">
                <div className="mb-1.5 text-2xl">{action.icon}</div>
                <div className="text-sm font-semibold">{action.title}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{action.sub}</div>
              </Card>
            </Link>
          ) : (
            <Card key={action.title} className="cursor-pointer p-5 text-center transition-colors hover:border-primary/30">
              <div className="mb-1.5 text-2xl">{action.icon}</div>
              <div className="text-sm font-semibold">{action.title}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{action.sub}</div>
            </Card>
          )
        ))}
      </div>

      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Customer Portal Preview
      </h2>
      <Link href="/portal/mrt-x7f2k9">
        <Card className="cursor-pointer border-primary/20 bg-gradient-to-br from-blue-500/10 to-purple-500/5 p-5 text-center transition-colors hover:border-primary/40">
          <div className="mb-1 text-xs text-muted-foreground">Shareable project link</div>
          <div className="font-mono text-sm text-muted-foreground">fieldopslite.com/p/mrt-x7f2k9</div>
          <div className="mt-3 flex justify-center gap-6">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-400">65%</div>
              <div className="text-[10px] text-muted-foreground">Complete</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-400">12</div>
              <div className="text-[10px] text-muted-foreground">Photos</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-amber-400">Mar 15</div>
              <div className="text-[10px] text-muted-foreground">Est. Done</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-primary">Tap to preview portal →</div>
        </Card>
      </Link>
    </div>
  );
}
