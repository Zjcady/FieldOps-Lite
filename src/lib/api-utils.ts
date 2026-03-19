import { NextRequest, NextResponse } from "next/server";
import { getUser, type AppUser } from "@/lib/auth/get-user";
import { z } from "zod";

// Re-export for convenience
export type { AppUser };

// ── Request ID ──────────────────────────────────────────────────────
// Generates a unique request ID for tracing. In production, Vercel adds
// x-vercel-id automatically — this provides a fallback for all environments.
export function getRequestId(): string {
  return crypto.randomUUID();
}

// ── Export hard limit (#55) ─────────────────────────────────────────
export const EXPORT_LIMIT = 10000;

// ── Success response with request ID (#62,#63) ─────────────────────────
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "x-request-id": getRequestId() },
  });
}

// ── Attach request ID to any existing response (#25) ──────────────────
export function withRequestId(response: NextResponse): NextResponse {
  response.headers.set("x-request-id", getRequestId());
  return response;
}

// ── Shared error response ──────────────────────────────────────────────
export function apiError(message: string, status: number) {
  const sanitized = status >= 500 ? "Internal server error" : message;
  return NextResponse.json({ error: sanitized, requestId: getRequestId() }, { status });
}

// ── Auth ────────────────────────────────────────────────────────────────
export async function authenticateApi(): Promise<
  [AppUser, null] | [null, NextResponse]
> {
  const user = await getUser();
  if (!user) return [null, apiError("Unauthorized", 401)];
  return [user, null];
}

// ── RBAC (#3) ───────────────────────────────────────────────────────────
const WRITE_ROLES = new Set(["owner", "ops_manager", "dispatcher", "crew_leader"]);
const ADMIN_ROLES = new Set(["owner", "ops_manager"]);

export function canWrite(user: AppUser): boolean {
  return WRITE_ROLES.has(user.role);
}
export function canAdmin(user: AppUser): boolean {
  return ADMIN_ROLES.has(user.role);
}
export function requireWrite(user: AppUser): NextResponse | null {
  if (!canWrite(user)) return apiError("Insufficient permissions", 403);
  return null;
}
export function requireAdmin(user: AppUser): NextResponse | null {
  if (!canAdmin(user)) return apiError("Admin access required", 403);
  return null;
}

// ── Safe JSON body parsing (#6) ─────────────────────────────────────────
export async function parseBody<T = unknown>(request: NextRequest): Promise<[T, null] | [null, NextResponse]> {
  try {
    const body = await request.json();
    return [body as T, null];
  } catch {
    return [null, apiError("Invalid JSON body", 400)];
  }
}

// ── Zod validation wrapper (#4) ─────────────────────────────────────────
export async function validateBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<[T, null] | [null, NextResponse]> {
  const [raw, parseErr] = await parseBody(request);
  if (parseErr) return [null, parseErr];

  const result = schema.safeParse(raw);
  if (!result.success) {
    const messages = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    return [null, apiError(`Validation failed: ${messages.join("; ")}`, 400)];
  }
  return [result.data, null];
}

// ── File upload validation (#7) ──────────────────────────────────────────
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) return `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`;
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return `Invalid file type: ${file.type}`;
  return null;
}

// ── Coordinate validation (#10) ──────────────────────────────────────────
export function validateCoords(lat: unknown, lng: unknown): { lat: number | null; lng: number | null } {
  const la = typeof lat === "string" ? parseFloat(lat) : null;
  const ln = typeof lng === "string" ? parseFloat(lng) : null;
  return {
    lat: la !== null && isFinite(la) && la >= -90 && la <= 90 ? la : null,
    lng: ln !== null && isFinite(ln) && ln >= -180 && ln <= 180 ? ln : null,
  };
}

// ── Pagination (#8) ─────────────────────────────────────────────────────
export function getPagination(request: NextRequest, defaultLimit = 25) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || String(defaultLimit), 10) || defaultLimit));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

// ── Safe search (#11) ───────────────────────────────────────────────────
export function getSafeSearch(request: NextRequest): string | undefined {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  if (!search) return undefined;
  return search.slice(0, 200).trim() || undefined;
}

// ── Date parsing (#9) ───────────────────────────────────────────────────
export function safeDate(value: unknown): Date | null {
  if (!value || typeof value !== "string") return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
}
