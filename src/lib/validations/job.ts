import { z } from "zod";
import { JOB_STATUSES } from "@/lib/job-state-machine";

// ── Job schemas ─────────────────────────────────────────────────────────
export const jobCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  customerId: z.string().uuid("Invalid customer ID"),
  propertyId: z.string().uuid().optional(),
  crewId: z.string().uuid().optional(),
  description: z.string().max(2000).optional(),
  type: z.enum(["project", "recurring"]),
  category: z.string().max(100).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  scheduledDate: z.string().optional(),
  estimatedEnd: z.string().optional(),
  estimatedCost: z.coerce.number().min(0).optional(),
  estimatedHours: z.coerce.number().min(0).optional(),
  address: z.string().max(500).optional(),
});

export type JobCreateInput = z.infer<typeof jobCreateSchema>;

export const jobUpdateSchema = jobCreateSchema.partial().extend({
  progress: z.number().min(0).max(100).optional(),
  actualHours: z.number().min(0).optional(),
  actualCost: z.number().min(0).optional(),
});

export const jobStatusSchema = z.object({
  status: z.enum(JOB_STATUSES),
});

// ── Task schemas ────────────────────────────────────────────────────────
export const taskCreateSchema = z.object({
  title: z.string().min(1, "Task title is required").max(300),
  description: z.string().max(1000).optional(),
});

export const taskUpdateSchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
  status: z.enum(["pending", "in_progress", "completed"]),
});

// ── Customer schemas ────────────────────────────────────────────────────
export const customerCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email().optional().or(z.literal("")).or(z.null()),
  phone: z.string().max(30).optional().or(z.null()),
  address: z.string().max(500).optional().or(z.null()),
});

export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;

// ── Permit schemas ──────────────────────────────────────────────────────
export const permitCreateSchema = z.object({
  jobId: z.string().uuid().optional().or(z.null()),
  permitNumber: z.string().max(100).optional().or(z.null()),
  type: z.string().min(1, "Type is required").max(100),
  status: z.enum(["pending", "submitted", "in_review", "approved", "denied", "expired"]).default("pending"),
  jurisdiction: z.string().max(200).optional().or(z.null()),
  issuedDate: z.string().optional().or(z.null()),
  expiryDate: z.string().optional().or(z.null()),
  cost: z.number().min(0).optional().or(z.null()),
  notes: z.string().max(2000).optional().or(z.null()),
});

export const inspectionUpdateSchema = z.object({
  type: z.string().max(100).optional(),
  status: z.enum(["scheduled", "requested", "confirmed", "passed", "failed", "cancelled"]).optional(),
  scheduledDate: z.string().optional(),
  completedDate: z.string().optional(),
  inspector: z.string().max(200).optional(),
  result: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
});

// ── Outreach schemas ────────────────────────────────────────────────────
export const campaignCreateSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(500),
  body: z.string().max(10000).optional().default(""),
  template: z.string().max(100).optional().default("general"),
  filter: z.enum(["all", "past", "active"]).optional().default("all"),
});

// ── Portal schemas ──────────────────────────────────────────────────────
export const portalMessageSchema = z.object({
  content: z.string().min(1, "Message is required").max(5000),
  senderType: z.enum(["customer", "contractor"]).default("customer"),
});

// ── Checkin schemas ─────────────────────────────────────────────────────
export const checkinSchema = z.object({
  type: z.enum(["checkin", "checkout"]),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});
