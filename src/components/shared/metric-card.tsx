import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  value: string | number;
  label: string;
  change?: string;
  changeColor?: string;
  valueColor?: string;
}

export function MetricCard({ value, label, change, changeColor = "text-muted-foreground", valueColor = "text-primary" }: MetricCardProps) {
  return (
    <Card className="p-4">
      <div className={cn("text-2xl font-semibold tracking-tight", valueColor)}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {change && (
        <div className={cn("mt-1 text-xs", changeColor)}>{change}</div>
      )}
    </Card>
  );
}
