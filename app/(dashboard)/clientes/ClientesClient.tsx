"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, UserCircle, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { crearCliente } from "@/app/actions";
import ExportarCartera from "./ExportarCartera";

type ClienteConResumen = {
  id: string;
  nombre: string;
  telefono: string | null;
  saldoPesos: number;
  saldoCartones: number;
  diasSinPagar: number;
  diasSinMovimiento: number;
  ultimaFecha: string | null;
  ultimaEntrega: { fecha: string; cantidad: number; clasificacion: string | null } | null;
};

export default function ClientesClient({ initialData }: { initialData: ClienteConResumen[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "con-deuda" | "al-dia">("todos");
  
  // Create client state
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = initialData.filter((c) => {
    const matchName = c.nombre.toLowerCase().includes(search.toLowerCase());
    if (!matchName) return false;
    
    if (filter === "con-deuda") return c.saldoPesos > 0;
    if (filter === "al-dia") return c.saldoPesos <= 0;
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await crearCliente({ nombre, telefono });
    setLoading(false);
    if (res.success) {
      setOpen(false);
      setNombre("");
      setTelefono("");
    } else {
      alert("Error al crear cliente");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cartera de Clientes</h2>
          <p className="text-muted-foreground">Gestiona tus clientes y sus saldos pendientes.</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <ExportarCartera clientes={initialData.map(c => ({
            nombre: c.nombre,
            telefono: c.telefono,
            saldoPesos: c.saldoPesos,
            ultimaFecha: c.ultimaFecha,
          }))} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button className="w-full sm:w-auto" />}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre o Razón Social</Label>
                  <Input id="nombre" required value={nombre} onChange={e => setNombre(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono (opcional)</Label>
                  <Input id="telefono" value={telefono} onChange={e => setTelefono(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" type="button" />}>
                  Cancelar
                </DialogClose>
                <Button type="submit" disabled={loading}>Guardar Cliente</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white dark:bg-card p-4 rounded-lg shadow-sm border border-border">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre..." 
            className="pl-9 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Button 
            variant={filter === "todos" ? "default" : "outline"} 
            onClick={() => setFilter("todos")}
            className="whitespace-nowrap"
          >
            Todos
          </Button>
          <Button 
            variant={filter === "con-deuda" ? "default" : "outline"} 
            onClick={() => setFilter("con-deuda")}
            className="whitespace-nowrap"
          >
            Con Deuda
          </Button>
          <Button 
            variant={filter === "al-dia" ? "default" : "outline"} 
            onClick={() => setFilter("al-dia")}
            className="whitespace-nowrap"
          >
            Al Día
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No se encontraron clientes con esos filtros.
          </div>
        )}
        
        {filtered.map(cliente => (
          <Link key={cliente.id} href={`/clientes/${cliente.id}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer shadow-sm group h-full flex flex-col relative overflow-hidden">
              {cliente.diasSinPagar > 30 && cliente.saldoPesos > 0 && (
                 <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
              )}
              <CardContent className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <UserCircle className="text-muted-foreground w-8 h-8" />
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                          {cliente.nombre}
                        </h3>
                        {cliente.telefono && (
                          <p className="text-xs text-muted-foreground">{cliente.telefono}</p>
                        )}
                      </div>
                    </div>
                    {cliente.telefono && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const cleanPhone = cliente.telefono!.replace(/\D/g, "");
                          let mensaje = `Hola ${cliente.nombre}, te recordamos que tienes un saldo pendiente de $${Math.max(0, cliente.saldoPesos).toLocaleString("es-CO")} en Avícola El Trébol.`;
                          if (cliente.ultimaEntrega) {
                            const clasif = cliente.ultimaEntrega.clasificacion ? ` ${cliente.ultimaEntrega.clasificacion.toLowerCase()}` : "";
                            mensaje += ` Tu última entrega fue el ${cliente.ultimaEntrega.fecha} (${cliente.ultimaEntrega.cantidad} cartones${clasif}).`;
                          }
                          mensaje += ` Gracias por tu confianza!`;
                          window.open(`https://wa.me/57${cleanPhone}?text=${encodeURIComponent(mensaje)}`, "_blank");
                        }}
                        className="text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 p-2 rounded-full transition-colors flex-shrink-0 ml-2"
                        title="Enviar recordatorio por WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                  {cliente.saldoPesos > 0 ? (
                    cliente.diasSinMovimiento >= 15 && cliente.diasSinMovimiento <= 30 ? (
                      <Badge variant="outline" className="mb-3 bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20">
                        Pendiente
                      </Badge>
                    ) : cliente.diasSinMovimiento > 30 ? (
                      <Badge variant="destructive" className="mb-3">
                        Atrasado
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary hover:bg-primary/20">
                        Al día
                      </Badge>
                    )
                  ) : (
                    <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary hover:bg-primary/20">
                      Al día
                    </Badge>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 bg-muted/50 p-3 rounded-md">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Deuda en Cartones</p>
                    <p className="font-semibold">{cliente.saldoCartones}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Deuda en Pesos</p>
                    <p className="font-semibold text-destructive">
                      ${Math.max(0, cliente.saldoPesos).toLocaleString("es-CO")}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 text-xs text-muted-foreground text-center font-medium bg-muted/20 py-1.5 rounded-md">
                  {cliente.diasSinMovimiento >= 0 ? `Última actividad: hace ${cliente.diasSinMovimiento} ${cliente.diasSinMovimiento === 1 ? 'día' : 'días'}` : "Sin movimientos registrados"}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
