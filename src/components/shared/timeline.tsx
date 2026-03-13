import { cn } from "@/lib/utils";

interface TimelineItem {
  id: string;
  title: string;
  subtitle?: string;
  dotColor: string;
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="pl-3">
      {items.map((item, i) => (
        <div key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
          <div className="relative flex-shrink-0">
            <div className={cn("mt-1 h-2.5 w-2.5 rounded-full", item.dotColor)} />
            {i < items.length - 1 && (
              <div className="absolute left-[4px] top-3 h-full w-0.5 bg-border" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">{item.title}</div>
            {item.subtitle && (
              <div className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
