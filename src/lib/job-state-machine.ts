export const JOB_STATUSES = [
  "scheduled",
  "active",
  "paused",
  "waiting_permit",
  "waiting_inspection",
  "waiting_materials",
  "completed",
  "invoiced",
  "cancelled",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

const TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  scheduled: ["active", "cancelled"],
  active: [
    "paused",
    "waiting_permit",
    "waiting_inspection",
    "waiting_materials",
    "completed",
    "cancelled",
  ],
  paused: ["active", "cancelled"],
  waiting_permit: ["active", "cancelled"],
  waiting_inspection: ["active", "completed", "cancelled"],
  waiting_materials: ["active", "cancelled"],
  completed: ["invoiced"],
  invoiced: [],
  cancelled: ["scheduled"],
};

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function getValidTransitions(current: JobStatus): JobStatus[] {
  return TRANSITIONS[current] ?? [];
}

export const STATUS_META: Record<
  string,
  { label: string; color: string; dotColor: string }
> = {
  scheduled: {
    label: "Scheduled",
    color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    dotColor: "bg-amber-400",
  },
  active: {
    label: "Active",
    color: "bg-green-500/15 text-green-400 border-green-500/30",
    dotColor: "bg-green-400",
  },
  paused: {
    label: "Paused",
    color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    dotColor: "bg-yellow-400",
  },
  waiting_permit: {
    label: "Awaiting Permit",
    color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    dotColor: "bg-purple-400",
  },
  waiting_inspection: {
    label: "Awaiting Inspection",
    color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    dotColor: "bg-purple-400",
  },
  waiting_materials: {
    label: "Awaiting Materials",
    color: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    dotColor: "bg-orange-400",
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    dotColor: "bg-emerald-400",
  },
  invoiced: {
    label: "Invoiced",
    color: "bg-teal-500/15 text-teal-400 border-teal-500/30",
    dotColor: "bg-teal-400",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-500/15 text-red-400 border-red-500/30",
    dotColor: "bg-red-400",
  },
  // Permit statuses
  pending: {
    label: "Pending",
    color: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    dotColor: "bg-slate-400",
  },
  submitted: {
    label: "Submitted",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    dotColor: "bg-blue-400",
  },
  in_review: {
    label: "In Review",
    color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    dotColor: "bg-purple-400",
  },
  approved: {
    label: "Approved",
    color: "bg-green-500/15 text-green-400 border-green-500/30",
    dotColor: "bg-green-400",
  },
  denied: {
    label: "Denied",
    color: "bg-red-500/15 text-red-400 border-red-500/30",
    dotColor: "bg-red-400",
  },
  expired: {
    label: "Expired",
    color: "bg-red-500/15 text-red-400 border-red-500/30",
    dotColor: "bg-red-400",
  },
  // Inspection statuses
  passed: {
    label: "Passed",
    color: "bg-green-500/15 text-green-400 border-green-500/30",
    dotColor: "bg-green-400",
  },
  failed: {
    label: "Failed",
    color: "bg-red-500/15 text-red-400 border-red-500/30",
    dotColor: "bg-red-400",
  },
};
