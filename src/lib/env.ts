import { z } from "zod/v4";

/**
 * Server-side environment variables — validated at build/startup time.
 * Add new vars here as phases are implemented.
 */
const serverSchema = z.object({
  DATABASE_URL: z.url(),
  DIRECT_URL: z.url(),

  // Phase 1: Auth
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Phase 7: Email
  RESEND_API_KEY: z.string().optional(),

  // General
  NEXT_PUBLIC_APP_URL: z.url().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

function getServerEnv(): ServerEnv {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.format());
    throw new Error("Invalid environment variables. Check server logs.");
  }
  return parsed.data;
}

export const env = getServerEnv();
