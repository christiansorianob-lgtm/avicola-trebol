"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Users, Receipt, Box } from "lucide-react";
import Link from "next/link";

type SearchResults = {
  clientes: { id: string; nombre: string; telefono: string | null }[];
  gastos: { id: string; fecha: string; categoria: string; descripcion: string | null; monto: number }[];
  despachos: { id: string; fecha: string; cartonesPequeno: number; cartonesMediano: number; cartonesGrande: number; cartonesJumbo: number }[];
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setIsOpen(true);
      } catch {
        setResults(null);
      }
      setLoading(false);
    }, 300);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults = results && (results.clientes.length > 0 || results.gastos.length > 0 || results.despachos.length > 0);

  const closeSearch = () => {
    setQuery("");
    setIsOpen(false);
    setResults(null);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar clientes, gastos, despachos..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/10 dark:bg-white/5 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results && setIsOpen(true)}
        />
        {query && (
          <button onClick={closeSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-2xl z-50 max-h-[400px] overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-muted-foreground text-sm">Buscando...</div>
          )}

          {!loading && !hasResults && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No se encontraron resultados para &quot;{query}&quot;
            </div>
          )}

          {!loading && hasResults && (
            <div className="py-2">
              {results!.clientes.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-3 h-3" /> Clientes
                  </div>
                  {results!.clientes.map((c) => (
                    <Link
                      key={c.id}
                      href={`/clientes/${c.id}`}
                      onClick={closeSearch}
                      className="block px-4 py-2.5 hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium text-sm">{c.nombre}</span>
                      {c.telefono && <span className="text-xs text-muted-foreground ml-2">{c.telefono}</span>}
                    </Link>
                  ))}
                </div>
              )}

              {results!.gastos.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 border-t border-border">
                    <Receipt className="w-3 h-3" /> Gastos
                  </div>
                  {results!.gastos.map((g) => (
                    <Link
                      key={g.id}
                      href="/gastos"
                      onClick={closeSearch}
                      className="block px-4 py-2.5 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{g.categoria}</span>
                        <span className="text-sm text-destructive font-medium">${g.monto.toLocaleString("es-CO")}</span>
                      </div>
                      {g.descripcion && <p className="text-xs text-muted-foreground">{g.descripcion}</p>}
                    </Link>
                  ))}
                </div>
              )}

              {results!.despachos.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 border-t border-border">
                    <Box className="w-3 h-3" /> Despachos
                  </div>
                  {results!.despachos.map((d) => {
                    const total = d.cartonesPequeno + d.cartonesMediano + d.cartonesGrande + d.cartonesJumbo;
                    return (
                      <Link
                        key={d.id}
                        href="/produccion"
                        onClick={closeSearch}
                        className="block px-4 py-2.5 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{new Date(d.fecha).toLocaleDateString("es-CO")}</span>
                          <span className="text-sm font-medium text-primary">{total} cartones</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
