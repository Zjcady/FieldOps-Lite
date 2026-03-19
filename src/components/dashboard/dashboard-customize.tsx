"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2, X } from "lucide-react";
import { DASHBOARD_WIDGETS, type DashboardWidget } from "./dashboard-config";

interface DashboardCustomizeProps {
  visible: Set<string>;
  onChange: (widgets: Set<string>) => void;
}

export function DashboardCustomize({ visible, onChange }: DashboardCustomizeProps) {
  const [open, setOpen] = useState(false);

  const toggle = (id: string) => {
    const next = new Set(visible);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(next);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title="Customize dashboard"
      >
        <Settings2 className="h-3.5 w-3.5" />
        Customize
      </button>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Customize Dashboard</h3>
        <button onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">Show or hide widgets to fit your workflow.</p>
      <div className="space-y-2">
        {DASHBOARD_WIDGETS.map((widget: DashboardWidget) => (
          <label key={widget.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted">
            <input
              type="checkbox"
              checked={visible.has(widget.id)}
              onChange={() => toggle(widget.id)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <div>
              <div className="text-sm font-medium">{widget.label}</div>
              <div className="text-xs text-muted-foreground">{widget.description}</div>
            </div>
          </label>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChange(new Set(DASHBOARD_WIDGETS.map((w) => w.id)))}
        >
          Show All
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          Done
        </Button>
      </div>
    </Card>
  );
}
