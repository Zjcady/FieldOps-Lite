import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserProvider } from "@/lib/auth/user-context";
import { getUser } from "@/lib/auth/get-user";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <UserProvider user={user}>
      <SidebarProvider defaultOpen>
        <AppSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Header />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <MobileNav />
        </div>
      </SidebarProvider>
    </UserProvider>
  );
}
