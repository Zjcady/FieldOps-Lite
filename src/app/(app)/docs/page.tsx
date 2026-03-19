import { Card } from "@/components/ui/card";
import Link from "next/link";

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
  auth: boolean;
}

interface EndpointGroup {
  name: string;
  endpoints: Endpoint[];
}

const API_GROUPS: EndpointGroup[] = [
  {
    name: "Jobs",
    endpoints: [
      { method: "GET", path: "/api/jobs", description: "List all jobs with filtering and pagination", auth: true },
      { method: "POST", path: "/api/jobs", description: "Create a new job", auth: true },
      { method: "GET", path: "/api/jobs/:id", description: "Get job details by ID", auth: true },
      { method: "PUT", path: "/api/jobs/:id", description: "Update a job", auth: true },
      { method: "DELETE", path: "/api/jobs/:id", description: "Delete a job", auth: true },
      { method: "PATCH", path: "/api/jobs/:id/status", description: "Update job status", auth: true },
      { method: "POST", path: "/api/jobs/:id/clone", description: "Clone an existing job", auth: true },
      { method: "GET", path: "/api/jobs/:id/tasks", description: "List tasks for a job", auth: true },
      { method: "POST", path: "/api/jobs/:id/tasks", description: "Create a task for a job", auth: true },
      { method: "PUT", path: "/api/jobs/:id/tasks/:taskId", description: "Update a job task", auth: true },
      { method: "DELETE", path: "/api/jobs/:id/tasks/:taskId", description: "Delete a job task", auth: true },
      { method: "GET", path: "/api/jobs/:id/notes", description: "List notes for a job", auth: true },
      { method: "POST", path: "/api/jobs/:id/notes", description: "Add a note to a job", auth: true },
      { method: "GET", path: "/api/jobs/:id/photos", description: "List photos for a job", auth: true },
      { method: "POST", path: "/api/jobs/:id/photos", description: "Upload a photo to a job", auth: true },
      { method: "GET", path: "/api/jobs/:id/checkins", description: "List check-ins for a job", auth: true },
      { method: "POST", path: "/api/jobs/:id/checkins", description: "Record a check-in for a job", auth: true },
      { method: "GET", path: "/api/jobs/:id/time-entries", description: "List time entries for a job", auth: true },
      { method: "POST", path: "/api/jobs/:id/time-entries", description: "Add a time entry to a job", auth: true },
    ],
  },
  {
    name: "Customers",
    endpoints: [
      { method: "GET", path: "/api/customers", description: "List all customers", auth: true },
      { method: "POST", path: "/api/customers", description: "Create a new customer", auth: true },
      { method: "GET", path: "/api/customers/:id", description: "Get customer details", auth: true },
      { method: "PUT", path: "/api/customers/:id", description: "Update a customer", auth: true },
      { method: "DELETE", path: "/api/customers/:id", description: "Delete a customer", auth: true },
    ],
  },
  {
    name: "Crews",
    endpoints: [
      { method: "GET", path: "/api/crews", description: "List all crews", auth: true },
      { method: "POST", path: "/api/crews", description: "Create a new crew", auth: true },
      { method: "GET", path: "/api/crews/:id", description: "Get crew details", auth: true },
      { method: "PUT", path: "/api/crews/:id", description: "Update a crew", auth: true },
      { method: "DELETE", path: "/api/crews/:id", description: "Delete a crew", auth: true },
      { method: "GET", path: "/api/crews/:id/utilization", description: "Get crew utilization stats", auth: true },
    ],
  },
  {
    name: "Permits",
    endpoints: [
      { method: "GET", path: "/api/permits", description: "List all permits", auth: true },
      { method: "POST", path: "/api/permits", description: "Create a new permit", auth: true },
      { method: "GET", path: "/api/permits/:id", description: "Get permit details", auth: true },
      { method: "PUT", path: "/api/permits/:id", description: "Update a permit", auth: true },
      { method: "DELETE", path: "/api/permits/:id", description: "Delete a permit", auth: true },
    ],
  },
  {
    name: "Inspections",
    endpoints: [
      { method: "GET", path: "/api/inspections", description: "List all inspections", auth: true },
      { method: "POST", path: "/api/inspections", description: "Schedule a new inspection", auth: true },
      { method: "GET", path: "/api/inspections/:id", description: "Get inspection details", auth: true },
      { method: "PUT", path: "/api/inspections/:id", description: "Update an inspection", auth: true },
      { method: "DELETE", path: "/api/inspections/:id", description: "Delete an inspection", auth: true },
    ],
  },
  {
    name: "Invoices",
    endpoints: [
      { method: "GET", path: "/api/invoices", description: "List all invoices", auth: true },
      { method: "POST", path: "/api/invoices", description: "Create a new invoice", auth: true },
    ],
  },
  {
    name: "Vendors",
    endpoints: [
      { method: "GET", path: "/api/vendors", description: "List all vendors", auth: true },
      { method: "POST", path: "/api/vendors", description: "Create a new vendor", auth: true },
      { method: "GET", path: "/api/vendors/:id", description: "Get vendor details", auth: true },
      { method: "PUT", path: "/api/vendors/:id", description: "Update a vendor", auth: true },
      { method: "DELETE", path: "/api/vendors/:id", description: "Delete a vendor", auth: true },
    ],
  },
  {
    name: "Reports",
    endpoints: [
      { method: "GET", path: "/api/reports/summary", description: "Dashboard summary metrics", auth: true },
      { method: "GET", path: "/api/reports/revenue", description: "Revenue report data", auth: true },
      { method: "GET", path: "/api/reports/velocity", description: "Job velocity and throughput stats", auth: true },
    ],
  },
  {
    name: "Finance",
    endpoints: [
      { method: "GET", path: "/api/finance/summary", description: "Financial summary overview", auth: true },
      { method: "GET", path: "/api/finance/trends", description: "Financial trend data over time", auth: true },
    ],
  },
  {
    name: "Outreach",
    endpoints: [
      { method: "GET", path: "/api/outreach/campaigns", description: "List outreach campaigns", auth: true },
      { method: "POST", path: "/api/outreach/campaigns", description: "Create a campaign", auth: true },
      { method: "GET", path: "/api/outreach/campaigns/:id", description: "Get campaign details", auth: true },
      { method: "PUT", path: "/api/outreach/campaigns/:id", description: "Update a campaign", auth: true },
    ],
  },
  {
    name: "Customer Portal",
    endpoints: [
      { method: "GET", path: "/api/portal/:token", description: "Get portal data by token", auth: false },
      { method: "GET", path: "/api/portal/:token/messages", description: "List portal messages", auth: false },
      { method: "POST", path: "/api/portal/:token/messages", description: "Send a portal message", auth: false },
    ],
  },
  {
    name: "Settings",
    endpoints: [
      { method: "GET", path: "/api/settings", description: "Get company settings", auth: true },
      { method: "PUT", path: "/api/settings", description: "Update company settings", auth: true },
    ],
  },
  {
    name: "Export",
    endpoints: [
      { method: "GET", path: "/api/export", description: "Export data as CSV", auth: true },
    ],
  },
  {
    name: "Auth",
    endpoints: [
      { method: "POST", path: "/api/auth/setup", description: "Initial account setup", auth: false },
      { method: "POST", path: "/api/auth/dev-login", description: "Development login (dev only)", auth: false },
      { method: "POST", path: "/api/auth/reset-password", description: "Request password reset", auth: false },
    ],
  },
  {
    name: "Health",
    endpoints: [
      { method: "GET", path: "/api/health", description: "Health check endpoint", auth: false },
    ],
  },
];

const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-400",
  POST: "bg-blue-500/15 text-blue-400",
  PUT: "bg-amber-500/15 text-amber-400",
  PATCH: "bg-orange-500/15 text-orange-400",
  DELETE: "bg-red-500/15 text-red-400",
};

export default function DocsPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Settings
          </Link>
          <span className="text-sm text-muted-foreground">/</span>
          <h1 className="text-lg font-semibold tracking-tight">
            API Documentation
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Internal reference for all available API endpoints. All authenticated
          endpoints require a valid session cookie.
        </p>
      </div>

      <div className="space-y-6 max-w-4xl">
        {API_GROUPS.map((group) => (
          <Card key={group.name} className="p-4">
            <h2 className="mb-3 text-sm font-semibold">{group.name}</h2>
            <div className="space-y-1.5">
              {group.endpoints.map((ep, i) => (
                <div
                  key={`${ep.method}-${ep.path}-${i}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted/50 sm:flex-nowrap"
                >
                  <span
                    className={`inline-flex w-16 shrink-0 items-center justify-center rounded px-1.5 py-0.5 text-xs font-bold ${
                      methodColors[ep.method] || ""
                    }`}
                  >
                    {ep.method}
                  </span>
                  <code className="shrink-0 text-xs text-foreground">
                    {ep.path}
                  </code>
                  <span className="text-xs text-muted-foreground">
                    {ep.description}
                  </span>
                  {ep.auth ? (
                    <span className="ml-auto inline-flex shrink-0 items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      Auth
                    </span>
                  ) : (
                    <span className="ml-auto inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Public
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
