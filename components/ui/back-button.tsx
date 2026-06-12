"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  
  // No mostrar el botón de volver en la página de inicio
  if (pathname === "/") return null;
  
  return (
    <Button 
      variant="ghost" 
      className="mb-4 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
      onClick={() => router.back()}
    >
      <ChevronLeft className="w-5 h-5 mr-1" />
      Atrás
    </Button>
  );
}
