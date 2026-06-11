"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Receipt, Box, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Gastos", href: "/gastos", icon: Receipt },
  { name: "Producción", href: "/produccion", icon: Box },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground h-screen sticky top-0 border-r border-sidebar-border shadow-xl">
      <div className="p-6 flex flex-col items-center justify-center border-b border-sidebar-border/50 gap-4 mt-2">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md p-2 relative overflow-hidden">
          {/* Logo container - white background to make logo pop since it has transparent/dark lines */}
          <img 
            src="/logo.png" 
            alt="Logo Avícola El Trébol" 
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white text-center font-heading">
          Avícola El Trébol
        </h1>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-md translate-x-1"
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80 hover:translate-x-1"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border/50">
        <button
          onClick={() => signOut()}
          className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 text-left text-sidebar-foreground/80 group"
        >
          <LogOut className="w-5 h-5 text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
