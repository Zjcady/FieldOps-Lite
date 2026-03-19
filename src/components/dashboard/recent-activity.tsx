"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useFetch } from "@/lib/hooks/use-fetch";
import { formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  job: { id: string; title: string; jobNumber: string } | null;
  user: { id: string; name: string } | null;
}

export function RecentActivity() {
  const { data: logs, loading } = useFetch<ActivityLog[]>("/api/activity");
  const recent = (logs ?? []).slice(0, 5);

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Activity
        </h2>
        <Link href="/activity" className="text-sm font-medium text-primary">
          See all
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-14 animate-pulse" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <Card className="p-4 text-center">
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {recent.map((log) => (
            <Card key={log.id} className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {log.job ? (
                      <Link href={`/jobs/${log.job.id}`} className="hover:text-primary">
                        {log.job.title}
                      </Link>
                    ) : (
                      "Unknown job"
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {log.action.replace(/_/g, " ")}
                    {log.user && <> &middot; {log.user.name}</>}
                  </div>
                </div>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
