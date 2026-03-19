"use client";

import Link from "next/link";
import { Plus, Clock, UserPlus, CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const actions = [
  { label: "New Job", href: "/jobs/new", icon: Plus, color: "text-blue-400" },
  { label: "Log Time", href: "/jobs", icon: Clock, color: "text-green-400", toast: "Select a job to log time" },
  { label: "Add Customer", href: "/customers", icon: UserPlus, color: "text-purple-400" },
  { label: "Schedule Crew", href: "/crew/schedule", icon: CalendarDays, color: "text-amber-400" },
];

export function QuickActions() {
  return (
    <div className="mb-6">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            onClick={() => { if (action.toast) toast.info(action.toast); }}
          >
            <Card className="flex cursor-pointer flex-col items-center gap-2 p-4 transition-all hover:border-primary/30 hover:translate-y-[-1px]">
              <action.icon className={`h-6 w-6 ${action.color}`} />
              <span className="text-sm font-medium">{action.label}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
