"use client";

import { useState, useEffect, useRef } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Triangle, Search, Bell, AlertTriangle, CheckCircle2, X } from "lucide-react";
import Link from "next/link";
import { APP_CONFIG } from "@/lib/app-config";
import { useUser } from "@/lib/auth/user-context";

interface Alert {
  id: string;
  type: "permit_expiring" | "inspection_passed" | "over_budget";
  title: string;
  message: string;
}

export function Header() {
  const user = useUser();
  const initials = user
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch alerts from dashboard summary API
  useEffect(() => {
    fetch("/api/reports/summary")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        const newAlerts: Alert[] = [];
        // We don't have granular alert data from summary, so use a simple approach
        if (data.pendingPermits > 0) {
          newAlerts.push({ id: "permits", type: "permit_expiring", title: "Pending Permits", message: `${data.pendingPermits} permit${data.pendingPermits > 1 ? "s" : ""} need attention` });
        }
        if (data.activeJobs > 3) {
          newAlerts.push({ id: "jobs", type: "inspection_passed", title: "Active Jobs", message: `${data.activeJobs} jobs currently in progress` });
        }
        setAlerts(newAlerts);
      })
      .catch((e) => console.warn("[FieldOps] Failed to load notifications:", e));
  }, []);

  // Close on click outside or Escape key
  useEffect(() => {
    if (!showNotifications) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showNotifications]);

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));
  const hasAlerts = visibleAlerts.length > 0;

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600">
            <Triangle className="h-3.5 w-3.5 text-white" fill="white" />
          </div>
          <span className="text-base font-semibold tracking-tight">{APP_CONFIG.name}</span>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/jobs"
          className="hidden items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground md:flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search…</span>
        </Link>

        {/* Notification bell - now functional */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:ml-1"
            aria-label={`Notifications${hasAlerts ? ` (${visibleAlerts.length})` : ""}`}
          >
            <Bell className="h-4 w-4" />
            {hasAlerts && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
            )}
          </button>

          {showNotifications && (
            <Card className="absolute right-0 top-10 z-50 w-72 p-0 shadow-lg">
              <div className="border-b border-border px-3 py-2">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground">Notifications</h3>
              </div>
              {visibleAlerts.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <Bell className="mx-auto mb-1 h-5 w-5 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {visibleAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-2 border-b border-border/50 px-3 py-2.5 last:border-0">
                      {alert.type === "permit_expiring" ? (
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium">{alert.title}</div>
                        <div className="text-[11px] text-muted-foreground">{alert.message}</div>
                      </div>
                      <button
                        onClick={() => setDismissed((prev) => new Set(prev).add(alert.id))}
                        className="flex-shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-border px-3 py-2 text-center">
                <Link
                  href="/"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-primary hover:underline"
                >
                  View dashboard
                </Link>
              </div>
            </Card>
          )}
        </div>

        <Avatar className="ml-1 h-8 w-8">
          <AvatarFallback className="bg-gradient-to-br from-primary to-purple-400 text-xs font-semibold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
