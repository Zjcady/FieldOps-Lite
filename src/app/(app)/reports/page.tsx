"use client";

import { useFetch } from "@/lib/hooks/use-fetch";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { formatCurrency } from "@/lib/format";
import {
  AlertCircle, FileSpreadsheet, TrendingUp, TrendingDown,
  DollarSign, Briefcase, Users, Clock, BarChart3,
  Target, Percent, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";

interface Analytics {
  revenue: {
    totalPaid: number;
    totalOutstanding: number;
    totalOverdue: number;
    thisMonth: number;
    lastMonth: number;
    changePercent: number;
    monthlyTrend: { month: string; revenue: number; invoiceCount: number }[];
    byCategory: { name: string; value: number }[];
  };
  jobs: {
    total: number;
    active: number;
    completed: number;
    avgProgress: number;
    byStatus: { status: string; count: number }[];
    byCategory: { category: string; count: number }[];
    velocity: { name: string; avgDays: number; count: number }[];
  };
  profitability: {
    avgMargin: number;
    revenuePerHour: number;
    totalMaterialCost: number;
  };
  crew: {
    hoursThisMonth: number;
    hoursLastMonth: number;
    monthlyTrend: { month: string; hours: number }[];
  };
  customers: {
    total: number;
    newThisMonth: number;
    repeatCustomers: number;
    repeatRate: number;
  };
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500", scheduled: "bg-blue-500", completed: "bg-emerald-500",
  invoiced: "bg-purple-500", paused: "bg-amber-500", cancelled: "bg-red-500",
  waiting_permit: "bg-orange-400", waiting_materials: "bg-yellow-500",
  waiting_inspection: "bg-cyan-400",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active", scheduled: "Scheduled", completed: "Completed",
  invoiced: "Invoiced", paused: "Paused", cancelled: "Cancelled",
  waiting_permit: "Waiting Permit", waiting_materials: "Waiting Materials",
  waiting_inspection: "Waiting Inspection",
};

const CAT_COLORS: Record<string, string> = {
  Hardscape: "bg-blue-500", Maintenance: "bg-green-500", Fencing: "bg-purple-400",
  Lanai: "bg-amber-500", Landscaping: "bg-emerald-500", Lighting: "bg-cyan-400",
  Irrigation: "bg-teal-400", Drainage: "bg-indigo-400", Other: "bg-slate-400",
};

function ChangeIndicator({ value, suffix = "%" }: { value: number; suffix?: string }) {
  if (value > 0) return <span className="inline-flex items-center gap-0.5 text-green-400"><ArrowUpRight className="h-3 w-3" />{value}{suffix}</span>;
  if (value < 0) return <span className="inline-flex items-center gap-0.5 text-red-400"><ArrowDownRight className="h-3 w-3" />{Math.abs(value)}{suffix}</span>;
  return <span className="inline-flex items-center gap-0.5 text-muted-foreground"><Minus className="h-3 w-3" />0{suffix}</span>;
}

function MiniBarChart({ data, valueKey, labelKey, maxHeight = 80 }: {
  data: { [key: string]: string | number }[];
  valueKey: string;
  labelKey: string;
  maxHeight?: number;
}) {
  const maxVal = Math.max(...data.map((d) => Number(d[valueKey])), 1);
  return (
    <div className="flex items-end gap-1" style={{ height: maxHeight }}>
      {data.map((d, i) => {
        const val = Number(d[valueKey]);
        const height = Math.max(2, (val / maxVal) * maxHeight);
        const isLast = i === data.length - 1;
        return (
          <div key={String(d[labelKey])} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`w-full rounded-t transition-all ${isLast ? "bg-primary" : "bg-primary/40"}`}
              style={{ height }}
              title={`${d[labelKey]}: ${val}`}
            />
            <span className="text-[9px] text-muted-foreground">{String(d[labelKey]).slice(0, 3)}</span>
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBar({ label, value, maxValue, color = "bg-primary", suffix = "" }: {
  label: string; value: number; maxValue: number; color?: string; suffix?: string;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}{suffix}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

function DonutChart({ segments, size = 120 }: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return null;

  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;

  // Pre-calculate offsets to avoid mutable variable during render
  const arcs = segments.reduce<{ label: string; dashLength: number; offset: number; color: string }[]>((acc, seg) => {
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dashLength : 0;
    acc.push({ label: seg.label, dashLength: (seg.value / total) * circumference, offset: prevOffset, color: seg.color });
    return acc;
  }, []);

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={size / 2} cy={size / 2} r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={12}
              strokeDasharray={`${arc.dashLength} ${circumference - arc.dashLength}`}
              strokeDashoffset={-arc.offset}
              className={arc.color.replace("bg-", "text-")}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          ))}
        <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className="fill-foreground text-lg font-bold">
          {total}
        </text>
      </svg>
      <div className="space-y-1">
        {segments.filter((s) => s.value > 0).slice(0, 6).map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-xs">
            <div className={`h-2 w-2 rounded-full ${seg.color}`} />
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="font-semibold">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { data, loading, error } = useFetch<Analytics>("/api/reports/analytics");

  if (loading || !data) {
    return (
      <div className="p-4 md:p-6" aria-busy={true}>
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-card" />)}
        </div>
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

  const hoursChange = data.crew.hoursLastMonth > 0
    ? Math.round(((data.crew.hoursThisMonth - data.crew.hoursLastMonth) / data.crew.hoursLastMonth) * 100)
    : 0;

  const maxRevByCat = Math.max(...data.revenue.byCategory.map((d) => d.value), 1);
  const maxVelocity = Math.max(...data.jobs.velocity.map((v) => v.avgDays), 1);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Analytics</h1>
          <p className="text-xs text-muted-foreground">Business performance at a glance</p>
        </div>
        <a
          href="/api/export?type=jobs&format=csv"
          download="fieldops-export.csv"
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Export
        </a>
      </div>

      {/* ═══ KPI Row ═══ */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          value={formatCurrency(data.revenue.thisMonth)}
          label="Revenue This Month"
          valueColor="text-green-400"
          borderColor="border-l-green-400"
          change={`${data.revenue.changePercent >= 0 ? "↑" : "↓"} ${Math.abs(data.revenue.changePercent)}% vs last month`}
          changeColor={data.revenue.changePercent >= 0 ? "text-green-400" : "text-red-400"}
        />
        <MetricCard
          value={data.jobs.active}
          label="Active Jobs"
          valueColor="text-blue-400"
          borderColor="border-l-blue-400"
          change={`${data.jobs.avgProgress}% avg progress`}
        />
        <MetricCard
          value={`${data.crew.hoursThisMonth}h`}
          label="Hours Logged"
          valueColor="text-purple-400"
          borderColor="border-l-purple-400"
          change={hoursChange !== 0 ? `${hoursChange >= 0 ? "↑" : "↓"} ${Math.abs(hoursChange)}% vs last month` : "Same as last month"}
          changeColor={hoursChange >= 0 ? "text-green-400" : "text-red-400"}
        />
        <MetricCard
          value={`${data.profitability.avgMargin}%`}
          label="Avg Profit Margin"
          valueColor={data.profitability.avgMargin >= 20 ? "text-green-400" : data.profitability.avgMargin >= 10 ? "text-amber-400" : "text-red-400"}
          borderColor={data.profitability.avgMargin >= 20 ? "border-l-green-400" : data.profitability.avgMargin >= 10 ? "border-l-amber-400" : "border-l-red-400"}
          change={data.profitability.revenuePerHour > 0 ? `$${data.profitability.revenuePerHour}/hr revenue` : undefined}
        />
      </div>

      {/* ═══ Revenue Trend ═══ */}
      <Card className="mb-5 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-400" />
            <h3 className="text-sm font-semibold">Revenue Trend</h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              Outstanding: <span className="font-semibold text-amber-400">{formatCurrency(data.revenue.totalOutstanding)}</span>
            </span>
            {data.revenue.totalOverdue > 0 && (
              <span className="text-muted-foreground">
                Overdue: <span className="font-semibold text-red-400">{formatCurrency(data.revenue.totalOverdue)}</span>
              </span>
            )}
          </div>
        </div>
        <MiniBarChart data={data.revenue.monthlyTrend} valueKey="revenue" labelKey="month" maxHeight={100} />
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>6-month trend</span>
          <span>Total collected: <span className="font-semibold text-foreground">{formatCurrency(data.revenue.totalPaid)}</span></span>
        </div>
      </Card>

      {/* ═══ Two Column: Jobs + Revenue by Category ═══ */}
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Job Distribution */}
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold">Job Distribution</h3>
          </div>
          <DonutChart
            segments={data.jobs.byStatus.map((s) => ({
              label: STATUS_LABELS[s.status] || s.status,
              value: s.count,
              color: STATUS_COLORS[s.status] || "bg-slate-400",
            }))}
          />
        </Card>

        {/* Revenue by Category */}
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-green-400" />
            <h3 className="text-sm font-semibold">Revenue by Category</h3>
          </div>
          <div className="space-y-2.5">
            {data.revenue.byCategory.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No revenue data yet</p>
            )}
            {data.revenue.byCategory.slice(0, 6).map((item) => (
              <HorizontalBar
                key={item.name}
                label={item.name}
                value={Number((item.value / 1000).toFixed(1))}
                maxValue={maxRevByCat / 1000}
                color={CAT_COLORS[item.name] || "bg-slate-400"}
                suffix="k"
              />
            ))}
          </div>
        </Card>
      </div>

      {/* ═══ Completion Velocity + Customer Insights ═══ */}
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Velocity */}
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-semibold">Completion Velocity</h3>
          </div>
          {data.jobs.velocity.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No completed jobs yet</p>
          ) : (
            <div className="space-y-2.5">
              {data.jobs.velocity.map((v) => (
                <HorizontalBar
                  key={v.name}
                  label={v.name}
                  value={v.avgDays}
                  maxValue={maxVelocity}
                  color="bg-purple-500"
                  suffix={`d (${v.count})`}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Customers */}
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold">Customer Insights</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <div className="text-2xl font-bold text-cyan-400">{data.customers.total}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Customers</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <div className="text-2xl font-bold text-green-400">+{data.customers.newThisMonth}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">New This Month</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <div className="text-2xl font-bold text-purple-400">{data.customers.repeatCustomers}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Repeat Clients</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <div className="text-2xl font-bold text-amber-400">{data.customers.repeatRate}%</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Repeat Rate</div>
            </div>
          </div>
        </Card>
      </div>

      {/* ═══ Crew Hours Trend ═══ */}
      <Card className="mb-5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-semibold">Labor Hours Trend</h3>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>vs last month:</span>
            <ChangeIndicator value={hoursChange} />
          </div>
        </div>
        <MiniBarChart data={data.crew.monthlyTrend} valueKey="hours" labelKey="month" maxHeight={80} />
      </Card>

      {/* ═══ Profitability Summary ═══ */}
      <Card className="mb-5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-green-400" />
          <h3 className="text-sm font-semibold">Profitability Summary</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Percent className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className={`mt-1 text-2xl font-bold ${data.profitability.avgMargin >= 20 ? "text-green-400" : data.profitability.avgMargin >= 10 ? "text-amber-400" : "text-red-400"}`}>
              {data.profitability.avgMargin}%
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Margin</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-1 text-2xl font-bold text-blue-400">
              ${data.profitability.revenuePerHour}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Rev/Hour</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              {data.profitability.avgMargin >= 15
                ? <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
            </div>
            <div className="mt-1 text-2xl font-bold text-foreground">
              {formatCurrency(data.profitability.totalMaterialCost)}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Material Costs</div>
          </div>
        </div>
      </Card>

      {/* ═══ Quick Actions ═══ */}
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Export & Integrations
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <a href="/api/export?type=jobs&format=csv" download="fieldops-jobs.csv">
          <Card className="cursor-pointer p-4 text-center transition-all hover:border-primary/30 hover:translate-y-[-1px]">
            <FileSpreadsheet className="mx-auto mb-2 h-5 w-5 text-green-400" />
            <div className="text-sm font-semibold">QuickBooks CSV</div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">Jobs + invoices</div>
          </Card>
        </a>
        <a href="/api/export?type=jobs&format=json" download="fieldops-jobs.json">
          <Card className="cursor-pointer p-4 text-center transition-all hover:border-primary/30 hover:translate-y-[-1px]">
            <TrendingUp className="mx-auto mb-2 h-5 w-5 text-blue-400" />
            <div className="text-sm font-semibold">JSON Export</div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">Analytics data</div>
          </Card>
        </a>
      </div>
    </div>
  );
}
