"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";
import Link from "next/link";

const PREFS_KEY = "fieldops-notification-prefs";

interface NotificationPrefs {
  jobStatusChange: boolean;
  inspectionScheduled: boolean;
  permitExpiring: boolean;
  dailySummary: boolean;
}

const defaults: NotificationPrefs = {
  jobStatusChange: true,
  inspectionScheduled: true,
  permitExpiring: true,
  dailySummary: false,
};

const labels: Record<keyof NotificationPrefs, string> = {
  jobStatusChange: "Email on job status change",
  inspectionScheduled: "Email on inspection scheduled",
  permitExpiring: "Email on permit expiring",
  dailySummary: "Email daily summary",
};

function Toggle({
  checked,
  onChange,
  "aria-labelledby": ariaLabelledBy,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  "aria-labelledby"?: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-labelledby={ariaLabelledBy}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaults);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) {
        setPrefs({ ...defaults, ...JSON.parse(stored) });
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  const update = (key: keyof NotificationPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  };

  if (!mounted) {
    return (
      <div className="p-4 md:p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-64 animate-pulse rounded-xl bg-card" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Settings
          </Link>
          <span className="text-sm text-muted-foreground">/</span>
          <h1 className="text-lg font-semibold tracking-tight">
            Notification Preferences
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose which email notifications you receive
        </p>
      </div>

      <Card className="max-w-lg p-4 space-y-1">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Email Notifications</h2>
        </div>

        {(Object.keys(labels) as (keyof NotificationPrefs)[]).map((key) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-lg px-2 py-3 hover:bg-muted/50"
          >
            <span className="text-sm" id={`label-${key}`}>{labels[key]}</span>
            <Toggle checked={prefs[key]} onChange={(v) => update(key, v)} aria-labelledby={`label-${key}`} />
          </div>
        ))}
      </Card>

      <p className="mt-4 max-w-lg text-xs text-muted-foreground">
        Preferences are stored locally. Backend email delivery is not yet
        configured.
      </p>
    </div>
  );
}
