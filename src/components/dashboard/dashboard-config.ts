// Dashboard widget configuration — contractor can show/hide any widget
// Stored in localStorage per user

export interface DashboardWidget {
  id: string;
  label: string;
  description: string;
  defaultVisible: boolean;
}

export const DASHBOARD_WIDGETS: DashboardWidget[] = [
  { id: "metrics", label: "Key Metrics", description: "Active jobs, permits, revenue, crews", defaultVisible: true },
  { id: "quick-actions", label: "Quick Actions", description: "New job, log time, add customer, schedule", defaultVisible: true },
  { id: "status-distribution", label: "Job Status", description: "Status breakdown pills", defaultVisible: true },
  { id: "todays-jobs", label: "Today's Jobs", description: "Active and scheduled jobs", defaultVisible: true },
  { id: "alerts", label: "Alerts", description: "Permits, inspections, materials", defaultVisible: true },
  { id: "recent-activity", label: "Recent Activity", description: "Latest activity across all jobs", defaultVisible: true },
];

const STORAGE_KEY = "fieldops-dashboard-config";

export function getVisibleWidgets(): Set<string> {
  if (typeof window === "undefined") {
    return new Set(DASHBOARD_WIDGETS.filter((w) => w.defaultVisible).map((w) => w.id));
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return new Set(JSON.parse(saved));
  } catch { /* ignore */ }
  return new Set(DASHBOARD_WIDGETS.filter((w) => w.defaultVisible).map((w) => w.id));
}

export function saveVisibleWidgets(widgets: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...widgets]));
  } catch { /* ignore */ }
}
