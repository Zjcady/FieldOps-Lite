"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Triangle, Search, Bell } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-600">
            <Triangle className="h-3.5 w-3.5 text-white" fill="white" />
          </div>
          <span className="text-base font-semibold tracking-tight">FieldOps Lite</span>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <button className="hidden items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground md:flex">
          <Search className="h-3.5 w-3.5" />
          <span>Search…</span>
          <kbd className="ml-4 rounded bg-background/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">⌘K</kbd>
        </button>
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:ml-1">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
        </button>
        <Avatar className="ml-1 h-8 w-8">
          <AvatarFallback className="bg-gradient-to-br from-primary to-purple-400 text-xs font-semibold text-white">
            SC
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
