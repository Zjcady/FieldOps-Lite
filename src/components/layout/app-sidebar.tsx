"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  BarChart3,
  Settings,
  Triangle,
  HardHat,
  LogOut,
  UserCircle,
  DollarSign,
  Mail,
  Receipt,
  Truck,
  Package,
  CalendarDays,
  Activity,
} from "lucide-react";
import { APP_CONFIG } from "@/lib/app-config";
import { useUser } from "@/lib/auth/user-context";
import { ROLE_LABELS } from "@/lib/constants";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/calendar", icon: CalendarDays, label: "Calendar" },
  { href: "/crew", icon: Users, label: "Crew & Dispatch" },
  { href: "/customers", icon: UserCircle, label: "Customers" },
  { href: "/vendors", icon: Truck, label: "Vendors" },
  { href: "/materials", icon: Package, label: "Materials" },
  { href: "/permits", icon: FileText, label: "Permits" },
  { href: "/finance", icon: DollarSign, label: "Finance" },
  { href: "/invoices", icon: Receipt, label: "Invoices" },
  { href: "/outreach", icon: Mail, label: "Outreach" },
  { href: "/activity", icon: Activity, label: "Activity" },
  { href: "/reports", icon: BarChart3, label: "Reports" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const user = useUser();
  const router = useRouter();

  const initials = user
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const supabase = createClient();
        await supabase.auth.signOut();
      } else {
        // Dev mode: clear the dev auth cookie
        await fetch("/api/auth/dev-login", { method: "DELETE" });
      }
    } catch {
      // Sign-out failed, but still navigate to login
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <Sidebar id="app-sidebar" className="border-r border-border">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600 shadow-md shadow-primary/25">
            <Triangle className="h-4 w-4 text-white" fill="white" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">{APP_CONFIG.name}</div>
            <div className="text-[11px] text-muted-foreground">{APP_CONFIG.tagline}</div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton render={<Link href={item.href} />} isActive={isActive}>
                      <item.icon className="h-[18px] w-[18px]" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-br from-primary to-purple-400 text-xs font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user?.name ?? "Not signed in"}</div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <HardHat className="h-3 w-3" />
              {user ? ROLE_LABELS[user.role] || user.role : "—"}
            </div>
          </div>
          {user && (
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              title="Sign out"
              aria-label="Sign out"
            >
              {signingOut ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
