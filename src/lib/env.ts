function required(key: string): string {
  const val = process.env[key];
  if (!val && process.env.NODE_ENV === "production") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val || "";
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  DIRECT_URL: process.env.DIRECT_URL || "",
  NEXT_PUBLIC_SUPABASE_URL: required("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  NODE_ENV: process.env.NODE_ENV || "development",
  isDev: process.env.NODE_ENV !== "production",
  isProd: process.env.NODE_ENV === "production",
};
