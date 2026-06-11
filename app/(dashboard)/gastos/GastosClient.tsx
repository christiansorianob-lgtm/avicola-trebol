"use client";

import { useState } from "react";
import { format, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Calendar as CalendarIcon, Filter } from "lucide-react";
import { registrarGasto } from "@/app/actions";

const CATEGORIAS = [
  "Concentrado",
  "Calcio",
  "Vacunas",
  "Vitaminas",
  "Cartones (empaques)",
  "Mensualidad empleada (pesaje de huevos)",
  "Otros"
];

type Gasto = {
  id: string;
  fecha: Date;
  categoria: string;
  descripcion: string | null;
  monto: number;
};

export default function GastosClient({ initialGastos }: { initialGastos: Gasto[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mesFiltro, setMesFiltro] = useState<string>(format(new Date(), "yyyy-MM"));

  // Form
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [descripcion, setDescripcion] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await registrarGasto({
      fecha: new Date(),
      categoria,
      descripcion,
      monto: parseFloat(monto)
    });
    setLoading(false);
    if (res.success) {
      setOpen(false);
      setMonto("");
      setDescripcion("");
    }
  };

  const currentFilterDate = new Date(mesFiltro + "-01T00:00:00");
  
  const filteredGastos = initialGastos.filter(g => 
    isSameMonth(new Date(g.fecha), currentFilterDate)
  );

  const totalMes = filteredGastos.reduce((sum, g) => sum + g.monto, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Control de Gastos</h2>
          <p className="text-muted-foreground">Registra y monitorea los gastos de la granja.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="w-full sm:w-auto" />}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Registrar Gasto
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Gasto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Monto ($)</Label>
                  <Input type="number" required value={monto} onChange={e => setMonto(e.target.value)} min="1" />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={categoria} onValueChange={(val) => setCategoria(val || CATEGORIAS[0])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descripción (opcional)</Label>
                  <Input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Ej: Bultos etapa inicio..." />
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" type="button" />}>
                  Cancelar
                </DialogClose>
                <Button type="submit" disabled={loading} className="bg-destructive text-destructive-foreground hover:bg-destructive/80">Guardar Gasto</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white dark:bg-card p-4 rounded-lg shadow-sm border border-border">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Label className="whitespace-nowrap">Filtrar por mes:</Label>
          <Input 
            type="month" 
            value={mesFiltro}
            onChange={(e) => setMesFiltro(e.target.value)}
            className="w-full sm:w-48"
          />
        </div>
        <div className="flex-1 text-right w-full sm:w-auto">
          <span className="text-sm text-muted-foreground mr-2">Total {format(currentFilterDate, "MMMM", { locale: es })}:</span>
          <span className="text-xl font-bold text-destructive">${totalMes.toLocaleString("es-CO")}</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {filteredGastos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No hay gastos registrados en este mes
                    </td>
                  </tr>
                )}
                {filteredGastos.map(g => (
                  <tr key={g.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                        {format(new Date(g.fecha), "dd/MM/yyyy")}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {g.categoria}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {g.descripcion || "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-destructive">
                      ${g.monto.toLocaleString("es-CO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
