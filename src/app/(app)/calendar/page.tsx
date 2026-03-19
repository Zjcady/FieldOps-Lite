"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Job {
  id: string;
  title: string;
  scheduledDate?: string;
  status: string;
  crew?: { name: string } | null;
}

const CREW_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-red-500",
  "bg-yellow-500",
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  useEffect(() => {
    const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = getDaysInMonth(year, month);
    const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    setLoading(true);
    fetch(`/api/jobs?from=${from}&to=${to}&take=200`)
      .then((r) => r.json())
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [year, month]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Build crew color map
  const crewNames = Array.from(new Set(jobs.filter((j) => j.crew?.name).map((j) => j.crew!.name)));
  const crewColorMap: Record<string, string> = {};
  crewNames.forEach((name, i) => {
    crewColorMap[name] = CREW_COLORS[i % CREW_COLORS.length];
  });

  // Group jobs by day
  const jobsByDay: Record<number, Job[]> = {};
  jobs.forEach((job) => {
    if (!job.scheduledDate) return;
    const d = new Date(job.scheduledDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!jobsByDay[day]) jobsByDay[day] = [];
      jobsByDay[day].push(job);
    }
  });

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const monthName = new Date(year, month).toLocaleString("default", { month: "long" });
  const todayDate = today.getDate();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="rounded-lg border border-border p-2 hover:bg-muted"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[140px] text-center font-semibold">
            {monthName} {year}
          </span>
          <button
            onClick={nextMonth}
            className="rounded-lg border border-border p-2 hover:bg-muted"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Crew legend */}
      {crewNames.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3">
          {crewNames.map((name) => (
            <div key={name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${crewColorMap[name]}`} />
              {name}
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/50">
            {DAY_LABELS.map((d) => (
              <div key={d} className="px-2 py-2 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-border bg-muted/20 md:min-h-[100px]" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayJobs = jobsByDay[day] || [];
              const isToday = isCurrentMonth && day === todayDate;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

              return (
                <Link
                  key={day}
                  href={`/jobs?from=${dateStr}&to=${dateStr}`}
                  className="group min-h-[80px] border-b border-r border-border p-1.5 transition-colors hover:bg-muted/50 md:min-h-[100px] md:p-2"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                        isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                      }`}
                    >
                      {day}
                    </span>
                    {dayJobs.length > 0 && (
                      <div className="flex gap-0.5">
                        {Array.from(new Set(dayJobs.map((j) => j.crew?.name).filter(Boolean))).map((crewName) => (
                          <span
                            key={crewName}
                            className={`inline-block h-2 w-2 rounded-full ${crewColorMap[crewName!]}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {dayJobs.slice(0, 3).map((job) => (
                      <div
                        key={job.id}
                        className="truncate rounded px-1 py-0.5 text-[10px] leading-tight text-muted-foreground group-hover:text-foreground md:text-xs"
                      >
                        {job.title}
                      </div>
                    ))}
                    {dayJobs.length > 3 && (
                      <div className="px-1 text-[10px] text-muted-foreground">+{dayJobs.length - 3} more</div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
