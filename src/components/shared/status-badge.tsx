import { STATUS_META } from "@/lib/job-state-machine";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = STATUS_META[status] ?? {
    label: status,
    color: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    dotColor: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        meta.color,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotColor)} />
      {meta.label}
    </span>
  );
}
