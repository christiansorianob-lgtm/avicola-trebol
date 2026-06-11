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
    <aside className="hidden md:flex flex-col w-64 bg-primary text-primary-foreground h-screen sticky top-0 border-r border-sidebar-border shadow-lg">
      <div className="p-6 flex items-center justify-center border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">Avícola El Trébol 🍀</h1>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-md transition-colors",
                isActive
                  ? "bg-secondary text-primary font-medium"
                  : "hover:bg-white/10"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-primary-foreground/70")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => signOut()}
          className="flex items-center space-x-3 px-4 py-3 w-full rounded-md hover:bg-white/10 transition-colors text-left"
        >
          <LogOut className="w-5 h-5 text-primary-foreground/70" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
