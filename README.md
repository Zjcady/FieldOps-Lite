# FieldOps

Field service management platform for construction and landscaping companies.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL via Supabase
- **ORM:** Prisma
- **Styling:** Tailwind CSS
- **Auth:** Supabase Auth
- **Language:** TypeScript

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL database (via Supabase)

## Setup

```bash
# Clone the repository
git clone <repo-url>
cd FieldOps

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Then fill in your Supabase and database credentials in .env

# Push the database schema
npx prisma db push

# Seed the database with sample data
npx prisma db seed

# Start the development server
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed the database |
| `npm run db:reset` | Reset database and re-seed |
| `npm run db:studio` | Open Prisma Studio |

## Deployment

### Vercel + Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Deploy to Vercel and connect your repository
3. Set the following environment variables in Vercel:
   - `DATABASE_URL` — Supabase pooled connection string
   - `DIRECT_URL` — Supabase direct connection string
   - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
4. Run `prisma db push` against your production database

## Project Structure

```
src/
  app/            — Next.js App Router pages and layouts
  components/     — Reusable UI components
  lib/            — Shared utilities, config, and database client
prisma/
  schema.prisma   — Database schema
  seed.ts         — Database seed script
public/           — Static assets
```

## Configuration

The app name and branding are configurable via `src/lib/app-config.ts`.
