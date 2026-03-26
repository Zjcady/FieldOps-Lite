import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserProvider } from "@/lib/auth/user-context";
import { FocusReset } from "@/components/shared/focus-reset";
import { CameraFab } from "@/components/shared/camera-fab";
import { OfflineIndicator } from "@/components/shared/offline-indicator";
import { CommandPalette } from "@/components/shared/command-palette";
import { getUser } from "@/lib/auth/get-user";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    // Check if they have a Supabase session but no Prisma user (first-time setup)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        redirect("/setup");
      }
    }
    redirect("/login");
  }

  return (
    <UserProvider user={user}>
      <FocusReset />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <a
        href="#app-sidebar"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to navigation
      </a>
      <a
        href="#job-search"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to search
      </a>
      <OfflineIndicator />
      <CommandPalette />
      <SidebarProvider defaultOpen>
        <AppSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Header />
          <main id="main-content" className="flex-1 pb-20 md:pb-0">{children}</main>
          <CameraFab />
          <MobileNav />
        </div>
      </SidebarProvider>
    </UserProvider>
  );
}
