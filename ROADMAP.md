# FieldOps: Production Roadmap

## Status Tracker

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Foundation & Naming | COMPLETE |
| 1 | Authentication & Authorization | COMPLETE |
| 2 | Core Job Operations (Full CRUD) | COMPLETE |
| 3 | Crew Dispatch & Scheduling | COMPLETE |
| 4 | Photos, Geotagging & Accountability | COMPLETE |
| 5 | Permits & Compliance | COMPLETE |
| 6 | Financial & Analytics | COMPLETE |
| 7 | Customer Outreach | COMPLETE |
| 8 | Production Hardening | COMPLETE |
| 9 | Deployment & CI/CD | COMPLETE |
| 10 | Mobile & PWA | COMPLETE |

---

## Phase 0: Foundation & Naming (Small)

- [ ] Create `src/lib/app-config.ts` — single source for app name
- [ ] Replace hardcoded "FieldOps Lite" in all layout files
- [ ] Fix build errors (remove `ignoreBuildErrors: true`, fix types properly)
- [ ] Create `src/lib/env.ts` with Zod-validated env vars
- [ ] Update `.env.example` with all needed vars

## Phase 1: Authentication & Authorization (Large)

- [ ] Install `@supabase/supabase-js`, `@supabase/ssr`
- [ ] Add `authId` to User model, run migration
- [ ] Create Supabase client files (client.ts, server.ts, middleware.ts)
- [ ] Create auth pages (login, signup, layout)
- [ ] Create auth callback/confirm routes
- [ ] Create `src/middleware.ts` — protect routes, pass through portal
- [ ] Create `src/lib/auth/get-user.ts` and `permissions.ts`
- [ ] Protect all 12 existing API routes with auth + companyId scoping
- [ ] Replace hardcoded user in sidebar/header with real user data
- [ ] Add companyId filters to dashboard queries

## Phase 2: Core Job Operations — Full CRUD (Large)

- [ ] Install `react-hook-form`, `@hookform/resolvers`
- [ ] Create Zod validation schemas (job, task, material, customer, vendor)
- [ ] Create job creation form (`/jobs/new`)
- [ ] Create job edit form (`/jobs/[id]/edit`) + inline editing
- [ ] Build task management (sortable with @dnd-kit, add/edit/delete)
- [ ] Build material tracking (list + form with vendor linking)
- [ ] Create customer pages (list + detail)
- [ ] Create vendor page
- [ ] New API routes (materials, customer detail, vendors)
- [ ] Wire "New Job" button, add search functionality
- [ ] Add Customers + Vendors to sidebar

## Phase 3: Crew Dispatch & Scheduling (Medium)

- [ ] Add `CrewAvailability` model, run migration
- [ ] Create weekly schedule view with grid
- [ ] Build draggable job cards using @dnd-kit
- [ ] Create crew assignment dialog
- [ ] Create availability editor
- [ ] New API routes (crew detail, availability, schedule)
- [ ] Add Schedule View link on crew page
- [ ] Show schedule conflicts

## Phase 4: Photos, Geotagging & Accountability (Large)

- [ ] Install `exifr`
- [ ] Add geo fields to Photo model + `CrewCheckIn` model, run migration
- [ ] Configure Supabase Storage bucket
- [ ] Create upload infrastructure (storage helpers, photo utils)
- [ ] Build photo upload component (camera, categories, EXIF, preview)
- [ ] Build photo gallery + lightbox
- [ ] Build crew check-in/check-out with GPS
- [ ] New API routes (photos, check-ins)
- [ ] Replace placeholder photo icons with actual images

## Phase 5: Permits & Compliance (Medium)

- [ ] Add `Document` model, run migration
- [ ] Create permit form + inspection form
- [ ] Build document upload component
- [ ] Build expiration alert system
- [ ] Add POST/PUT/DELETE to permit/inspection APIs
- [ ] Replace hardcoded dashboard alerts with dynamic data
- [ ] Add action buttons to permits page

## Phase 6: Financial & Analytics (Large)

- [ ] Add `TimeEntry` model + cost fields to Job/User, run migration
- [ ] Create financial dashboard (revenue trends, margins, top customers)
- [ ] Create operations dashboard (duration, utilization, bottlenecks)
- [ ] Build invoice management (list, generate, preview)
- [ ] Build time entry logging
- [ ] Create export endpoints (CSV/JSON)
- [ ] Wire export buttons on reports page
- [ ] Add Invoices to sidebar

## Phase 7: Customer Outreach (Medium)

- [ ] Install `resend`, `@react-email/components`
- [ ] Add `EmailCampaign` + `EmailRecipient` models, run migration
- [ ] Create React Email templates (5 templates)
- [ ] Build outreach pages (campaign list, create with segmentation)
- [ ] Build email preview component
- [ ] New API routes (email send, campaigns, webhook)
- [ ] Add Outreach to sidebar
- [ ] Add email history to customer detail

## Phase 8: Production Hardening (Large)

- [ ] Create `src/lib/api-utils.ts` (withAuth, validateBody, apiError, withRateLimit)
- [ ] Apply Zod + auth wrapper to ALL API routes
- [ ] Fix unsafe field spreading in PUT handlers
- [ ] Add security headers to `next.config.ts`
- [ ] Add database indexes
- [ ] Create error boundary + custom 404/error pages
- [ ] Create structured logging utility
- [ ] Configure Next.js Image with Supabase Storage

## Phase 9: Deployment & CI/CD (Medium)

- [ ] Create `vercel.json`
- [ ] Create GitHub Actions workflows (CI + DB migrate)
- [ ] Create backup/migration scripts
- [ ] Set up Supabase production project
- [ ] Enable RLS policies
- [ ] Configure Storage bucket policies
- [ ] Document deployment process

## Phase 10: Mobile & PWA (Medium)

- [ ] Install `@serwist/next`
- [ ] Create PWA manifest
- [ ] Create service worker (caching + offline photo queue)
- [ ] Build offline sync system
- [ ] Create push notification routes
- [ ] Responsive audit and fixes
- [ ] Add camera quick-action to mobile nav
