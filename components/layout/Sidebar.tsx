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
    <aside className="hidden md:flex flex-col w-72 bg-white/60 dark:bg-black/40 backdrop-blur-2xl h-screen sticky top-0 border-r border-white/50 dark:border-white/10 shadow-[8px_0_30px_rgba(0,0,0,0.05)] z-20">
      <div className="p-8 flex flex-col items-center justify-center border-b border-black/5 dark:border-white/10 gap-6 mt-4">
        {/* Logo Container - Made much larger, blending into the background */}
        <div className="w-40 h-40 flex items-center justify-center relative">
          <img 
            src="/logo.png" 
            alt="Logo Avícola El Trébol" 
            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal dark:bg-white dark:rounded-3xl dark:p-2 shadow-sm drop-shadow-md transition-transform duration-500 hover:scale-105"
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground text-center font-heading bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-sm">
          Avícola El Trébol
        </h1>
      </div>
      
      <nav className="flex-1 py-8 px-5 space-y-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                isActive
                  ? "bg-gradient-to-r from-primary to-secondary text-white font-medium shadow-[0_4px_20px_rgba(72,122,34,0.3)] translate-x-1"
                  : "hover:bg-white/80 dark:hover:bg-white/10 text-foreground/70 hover:text-foreground hover:shadow-md hover:translate-x-1"
              )}
            >
              <item.icon className={cn("w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110", isActive ? "text-white" : "text-primary/70 group-hover:text-primary")} />
              <span className="relative z-10 text-[15px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-5 border-t border-black/5 dark:border-white/10">
        <button
          onClick={() => signOut()}
          className="flex items-center space-x-4 px-5 py-4 w-full rounded-2xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-300 text-left text-foreground/70 hover:text-red-600 group"
        >
          <LogOut className="w-5 h-5 text-foreground/50 group-hover:text-red-500 transition-transform duration-300 group-hover:-translate-x-1" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
