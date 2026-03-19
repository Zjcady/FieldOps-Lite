"use client";
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground/50" />
      </div>
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      {description && <p className="mb-3 max-w-xs text-xs text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}
