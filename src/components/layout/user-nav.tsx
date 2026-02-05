"use client";

import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut, CreditCard } from "lucide-react";
import Link from "next/link";

export function UserNav() {
  const { data: session } = useSession();

  // Ambil inisial nama jika tidak ada foto
  const initials = session?.user?.name
    ? session.user.name.substring(0, 2).toUpperCase()
    : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all hover:scale-105 active:scale-95 shadow-sm overflow-hidden border-2 border-white/20">
          <Avatar className="h-full w-full">
            <AvatarImage
              src={session?.user?.image || ""}
              alt={session?.user?.name || "User"}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-violet-600 text-white font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64 p-2 glass bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-white/20"
        align="end"
        forceMount>
        <DropdownMenuLabel className="font-normal p-3 bg-muted/40 rounded-lg mb-1">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none text-foreground truncate">
              {session?.user?.name}
            </p>
            <p className="text-xs leading-none text-muted-foreground font-medium truncate">
              {session?.user?.email}
            </p>
            <div className="pt-1 mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase border border-primary/20">
                {session?.user?.role}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-2 bg-border/50" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/billing" className="cursor-pointer">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-2 bg-border/50" />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/20 focus:text-red-600 dark:focus:text-red-400 font-medium cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
