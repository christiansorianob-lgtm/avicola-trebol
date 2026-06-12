"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ variant = "sidebar" }: { variant?: "sidebar" | "mobile" }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("avicola_theme");
    if (saved === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      setIsDark(true);
    }
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("avicola_theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("avicola_theme", "light");
    }
  };

  if (variant === "mobile") {
    return (
      <button
        onClick={toggle}
        className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        <span className="text-[10px]">{isDark ? "Claro" : "Oscuro"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center space-x-4 px-5 py-4 w-full rounded-2xl hover:bg-white/5 transition-all duration-300 text-left text-foreground/70 hover:text-foreground group"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-foreground/50 group-hover:text-yellow-400 transition-transform duration-300" />
      ) : (
        <Moon className="w-5 h-5 text-foreground/50 group-hover:text-blue-400 transition-transform duration-300" />
      )}
      <span className="font-medium">{isDark ? "Modo Claro" : "Modo Oscuro"}</span>
    </button>
  );
}
