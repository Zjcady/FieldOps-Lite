import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  value: string | number;
  label: string;
  change?: string;
  changeColor?: string;
  valueColor?: string;
  borderColor?: string;
}

export function MetricCard({ value, label, change, changeColor = "text-muted-foreground", valueColor = "text-primary", borderColor }: MetricCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden p-4",
      borderColor && `border-l-[3px] ${borderColor}`
    )}>
      <div className={cn("text-2xl font-bold tracking-tight", valueColor)}>
        {value}
      </div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {change && (
        <div className={cn("mt-1.5 text-xs font-medium", changeColor)}>{change}</div>
      )}
    </Card>
  );
}
