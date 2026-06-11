"use client";

import { useState } from "react";
import { format } from "date-fns";
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
import { PlusCircle, Calendar as CalendarIcon, PackageOpen } from "lucide-react";
import { registrarBajada } from "@/app/actions";

type Bajada = {
  id: string;
  fecha: Date;
  cartones13: number;
  cartones15: number;
  cartones18: number;
  cartones20: number;
  notas: string | null;
};

export default function ProduccionClient({ initialBajadas }: { initialBajadas: Bajada[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form
  const [c13, setC13] = useState(0);
  const [c15, setC15] = useState(0);
  const [c18, setC18] = useState(0);
  const [c20, setC20] = useState(0);
  const [notas, setNotas] = useState("");

  const totalCartones = c13 + c15 + c18 + c20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalCartones === 0) {
      alert("Debe registrar al menos un cartón");
      return;
    }
    
    setLoading(true);
    const res = await registrarBajada({
      fecha: new Date(),
      cartones13: c13,
      cartones15: c15,
      cartones18: c18,
      cartones20: c20,
      notas
    });
    setLoading(false);
    if (res.success) {
      setOpen(false);
      setC13(0);
      setC15(0);
      setC18(0);
      setC20(0);
      setNotas("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Producción (Bajadas)</h2>
          <p className="text-muted-foreground">Historial de bajadas de finca por tipo de empaque.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90" />}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Registrar Bajada
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Registrar Bajada de Finca</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cartones de 13</Label>
                    <Input type="number" value={c13 || ''} onChange={e => setC13(parseInt(e.target.value) || 0)} min="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cartones de 15</Label>
                    <Input type="number" value={c15 || ''} onChange={e => setC15(parseInt(e.target.value) || 0)} min="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cartones de 18</Label>
                    <Input type="number" value={c18 || ''} onChange={e => setC18(parseInt(e.target.value) || 0)} min="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cartones de 20</Label>
                    <Input type="number" value={c20 || ''} onChange={e => setC20(parseInt(e.target.value) || 0)} min="0" />
                  </div>
                </div>
                <div className="pt-2 pb-1 border-t border-b border-border flex justify-between items-center bg-muted/50 px-3 rounded-md">
                  <span className="font-medium text-sm">Total Cartones:</span>
                  <span className="font-bold text-lg text-primary">{totalCartones}</span>
                </div>
                <div className="space-y-2">
                  <Label>Notas (opcional)</Label>
                  <Input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observaciones de la bajada..." />
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" type="button" />}>
                  Cancelar
                </DialogClose>
                <Button type="submit" disabled={loading || totalCartones === 0}>Guardar Bajada</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initialBajadas.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No hay bajadas registradas.
          </div>
        )}
        
        {initialBajadas.map(bajada => {
          const total = bajada.cartones13 + bajada.cartones15 + bajada.cartones18 + bajada.cartones20;
          return (
            <Card key={bajada.id} className="shadow-sm border-border">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="font-medium text-foreground">{format(new Date(bajada.fecha), "dd/MM/yyyy HH:mm")}</span>
                  </div>
                  <div className="bg-primary/10 text-primary px-2 py-1 rounded font-bold flex items-center gap-1 text-sm">
                    <PackageOpen className="w-4 h-4" /> {total}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="bg-muted/50 text-center p-2 rounded">
                    <p className="text-[10px] text-muted-foreground uppercase">x13</p>
                    <p className="font-semibold">{bajada.cartones13}</p>
                  </div>
                  <div className="bg-muted/50 text-center p-2 rounded">
                    <p className="text-[10px] text-muted-foreground uppercase">x15</p>
                    <p className="font-semibold">{bajada.cartones15}</p>
                  </div>
                  <div className="bg-muted/50 text-center p-2 rounded">
                    <p className="text-[10px] text-muted-foreground uppercase">x18</p>
                    <p className="font-semibold">{bajada.cartones18}</p>
                  </div>
                  <div className="bg-muted/50 text-center p-2 rounded">
                    <p className="text-[10px] text-muted-foreground uppercase">x20</p>
                    <p className="font-semibold">{bajada.cartones20}</p>
                  </div>
                </div>

                {bajada.notas && (
                  <p className="text-xs text-muted-foreground bg-accent/5 p-2 rounded border border-accent/20">
                    <span className="font-medium mr-1 text-accent-foreground/80">Nota:</span> {bajada.notas}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
