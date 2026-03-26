export const DEMO_COMPANY_ID_KEY = "demo_company_id";

export const JOB_TYPES = ["project", "recurring"] as const;

export const JOB_CATEGORIES = [
  "Hardscape",
  "Fencing",
  "Lanai",
  "Landscaping",
  "Lighting",
  "Maintenance",
] as const;

export const JOB_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-500",
  medium: "bg-blue-500",
  high: "bg-amber-500",
  urgent: "bg-red-500",
};

export const USER_ROLES = [
  "owner",
  "ops_manager",
  "dispatcher",
  "crew_leader",
  "crew_member",
  "subcontractor",
  "customer",
] as const;

export const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  ops_manager: "Operations Manager",
  dispatcher: "Dispatcher",
  crew_leader: "Crew Leader",
  crew_member: "Crew Member",
  subcontractor: "Subcontractor",
  customer: "Customer",
};

export const PERMIT_STATUSES = [
  "pending",
  "submitted",
  "in_review",
  "approved",
  "denied",
  "expired",
] as const;

export const INSPECTION_STATUSES = [
  "scheduled",
  "requested",
  "confirmed",
  "passed",
  "failed",
  "cancelled",
] as const;

export const MATERIAL_STATUSES = [
  "needed",
  "ordered",
  "delivered",
  "installed",
] as const;

export const PHOTO_CATEGORIES = [
  "before", "progress", "after", "issue", "material", "arrival", "departure",
] as const;

export const PRICING_UNITS = ["sqft", "linft", "each", "day", "hour"] as const;

export const UNIT_LABELS: Record<string, string> = {
  sqft: "per sq ft",
  linft: "per linear ft",
  each: "per unit",
  day: "per day",
  hour: "per hour",
};
