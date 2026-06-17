"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, PackageOpen, Layers, Activity, Edit, Trash2 } from "lucide-react";
import { registrarBajada, editarBajada, eliminarBajada } from "@/app/actions";

type Bajada = {
  id: string;
  fecha: Date;
  cartonesPequeno: number;
  cartonesMediano: number;
  cartonesGrande: number;
  cartonesJumbo: number;
  notas: string | null;
};

type Inventario = {
  pequeno: number;
  mediano: number;
  grande: number;
  jumbo: number;
};

type MermaMes = {
  pequeno: number;
  mediano: number;
  grande: number;
  jumbo: number;
  totalEntradas: number;
  totalSalidas: number;
};

export default function ProduccionClient({ 
  initialBajadas,
  inventario,
  mermaMes
}: { 
  initialBajadas: Bajada[],
  inventario: Inventario,
  mermaMes: MermaMes
}) {
  const [open, setOpen] = useState(false);
  const [editingBajada, setEditingBajada] = useState<Bajada | null>(null);
  const [deletingBajada, setDeletingBajada] = useState<Bajada | null>(null);
  const [loading, setLoading] = useState(false);

  // Form
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [cPequeno, setCPequeno] = useState(0);
  const [cMediano, setCMediano] = useState(0);
  const [cGrande, setCGrande] = useState(0);
  const [cJumbo, setCJumbo] = useState(0);
  const [notas, setNotas] = useState("");

  const totalCartones = cPequeno + cMediano + cGrande + cJumbo;

  // Edit form
  const [editFecha, setEditFecha] = useState("");
  const [editCPequeno, setEditCPequeno] = useState(0);
  const [editCMediano, setEditCMediano] = useState(0);
  const [editCGrande, setEditCGrande] = useState(0);
  const [editCJumbo, setEditCJumbo] = useState(0);
  const [editNotas, setEditNotas] = useState("");
  const editTotalCartones = editCPequeno + editCMediano + editCGrande + editCJumbo;

  const openEdit = (b: Bajada) => {
    setEditingBajada(b);
    setEditFecha(format(new Date(b.fecha), "yyyy-MM-dd'T'HH:mm"));
    setEditCPequeno(b.cartonesPequeno);
    setEditCMediano(b.cartonesMediano);
    setEditCGrande(b.cartonesGrande);
    setEditCJumbo(b.cartonesJumbo);
    setEditNotas(b.notas || "");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBajada) return;
    if (editTotalCartones === 0) {
      alert("Debe registrar al menos un cartón");
      return;
    }
    setLoading(true);
    const res = await editarBajada(editingBajada.id, {
      fecha: new Date(editFecha),
      cartonesPequeno: editCPequeno,
      cartonesMediano: editCMediano,
      cartonesGrande: editCGrande,
      cartonesJumbo: editCJumbo,
      notas: editNotas
    });
    setLoading(false);
    if (res.success) {
      setEditingBajada(null);
    }
  };

  const handleDeleteBajada = async () => {
    if (!deletingBajada) return;
    setLoading(true);
    const res = await eliminarBajada(deletingBajada.id);
    setLoading(false);
    if (res.success) {
      setDeletingBajada(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalCartones === 0) {
      alert("Debe registrar al menos un cartón");
      return;
    }
    
    setLoading(true);
    const res = await registrarBajada({
      fecha: new Date(fecha),
      cartonesPequeno: cPequeno,
      cartonesMediano: cMediano,
      cartonesGrande: cGrande,
      cartonesJumbo: cJumbo,
      notas
    });
    setLoading(false);
    if (res.success) {
      setOpen(false);
      setCPequeno(0);
      setCMediano(0);
      setCGrande(0);
      setCJumbo(0);
      setNotas("");
      setFecha(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Despachos e Inventario</h2>
          <p className="text-muted-foreground">Control de stock de cartones y recepciones desde la finca.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90" />}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Registrar Despacho
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Registrar Despacho de Finca</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Fecha del Despacho</Label>
                  <Input type="datetime-local" required value={fecha} onChange={e => setFecha(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pequeño</Label>
                    <Input type="number" value={cPequeno || ''} onChange={e => setCPequeno(parseInt(e.target.value) || 0)} min="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mediano</Label>
                    <Input type="number" value={cMediano || ''} onChange={e => setCMediano(parseInt(e.target.value) || 0)} min="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Grande</Label>
                    <Input type="number" value={cGrande || ''} onChange={e => setCGrande(parseInt(e.target.value) || 0)} min="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Jumbo</Label>
                    <Input type="number" value={cJumbo || ''} onChange={e => setCJumbo(parseInt(e.target.value) || 0)} min="0" />
                  </div>
                </div>
                <div className="pt-2 pb-1 border-t border-b border-border flex justify-between items-center bg-muted/50 px-3 rounded-md">
                  <span className="font-medium text-sm">Total Cartones:</span>
                  <span className="font-bold text-lg text-primary">{totalCartones}</span>
                </div>
                <div className="space-y-2">
                  <Label>Notas (opcional)</Label>
                  <Input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observaciones del despacho..." />
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" type="button" />}>
                  Cancelar
                </DialogClose>
                <Button type="submit" disabled={loading || totalCartones === 0}>Guardar Despacho</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* INVENTARIO ACTUAL */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          Inventario Actual
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pequeño</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{inventario.pequeno}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mediano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{inventario.mediano}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Grande</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{inventario.grande}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Jumbo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{inventario.jumbo}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ANÁLISIS DE MERMAS (ESTE MES) */}
      <Card className="border-t-4 border-t-amber-500 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            Análisis de Mermas / Faltantes (Este Mes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center mt-4 mb-2">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Despachado (Finca)</p>
              <p className="text-2xl font-bold text-primary">{mermaMes.totalEntradas}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Entregado (Clientes)</p>
              <p className="text-2xl font-bold text-secondary-foreground">{mermaMes.totalSalidas}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Diferencia (Inventario/Merma)</p>
              <p className={`text-2xl font-bold ${mermaMes.totalEntradas - mermaMes.totalSalidas < 0 ? 'text-destructive' : 'text-foreground'}`}>
                {mermaMes.totalEntradas - mermaMes.totalSalidas}
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-center mt-4">
            Comparativa del mes actual para detectar posibles pérdidas, daños de cartones o faltantes en ruta.
          </div>
        </CardContent>
      </Card>

      {/* HISTORIAL DE DESPACHOS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PackageOpen className="w-5 h-5 text-muted-foreground" />
            Historial de Recepciones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Fecha</TableHead>
                  <TableHead className="text-center">Pequeño</TableHead>
                  <TableHead className="text-center">Mediano</TableHead>
                  <TableHead className="text-center">Grande</TableHead>
                  <TableHead className="text-center">Jumbo</TableHead>
                  <TableHead className="text-center font-bold">Total</TableHead>
                  <TableHead className="min-w-[200px]">Notas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialBajadas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No hay despachos registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  initialBajadas.map((bajada) => {
                    const total = bajada.cartonesPequeno + bajada.cartonesMediano + bajada.cartonesGrande + bajada.cartonesJumbo;
                    return (
                      <TableRow key={bajada.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {format(new Date(bajada.fecha), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="text-center">{bajada.cartonesPequeno}</TableCell>
                        <TableCell className="text-center">{bajada.cartonesMediano}</TableCell>
                        <TableCell className="text-center">{bajada.cartonesGrande}</TableCell>
                        <TableCell className="text-center">{bajada.cartonesJumbo}</TableCell>
                        <TableCell className="text-center font-bold text-primary">{total}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {bajada.notas || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(bajada)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeletingBajada(bajada)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Formulario Editar Despacho */}
      <Dialog open={!!editingBajada} onOpenChange={(o) => !o && setEditingBajada(null)}>
        <DialogContent>
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Editar Despacho de Finca</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Fecha del Despacho</Label>
                <Input type="datetime-local" required value={editFecha} onChange={e => setEditFecha(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pequeño</Label>
                  <Input type="number" value={editCPequeno || ''} onChange={e => setEditCPequeno(parseInt(e.target.value) || 0)} min="0" />
                </div>
                <div className="space-y-2">
                  <Label>Mediano</Label>
                  <Input type="number" value={editCMediano || ''} onChange={e => setEditCMediano(parseInt(e.target.value) || 0)} min="0" />
                </div>
                <div className="space-y-2">
                  <Label>Grande</Label>
                  <Input type="number" value={editCGrande || ''} onChange={e => setEditCGrande(parseInt(e.target.value) || 0)} min="0" />
                </div>
                <div className="space-y-2">
                  <Label>Jumbo</Label>
                  <Input type="number" value={editCJumbo || ''} onChange={e => setEditCJumbo(parseInt(e.target.value) || 0)} min="0" />
                </div>
              </div>
              <div className="pt-2 pb-1 border-t border-b border-border flex justify-between items-center bg-muted/50 px-3 rounded-md">
                <span className="font-medium text-sm">Total Cartones:</span>
                <span className="font-bold text-lg text-primary">{editTotalCartones}</span>
              </div>
              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Input value={editNotas} onChange={e => setEditNotas(e.target.value)} placeholder="Observaciones del despacho..." />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button" />}>
                Cancelar
              </DialogClose>
              <Button type="submit" disabled={loading || editTotalCartones === 0}>Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmar Eliminar Despacho */}
      <Dialog open={!!deletingBajada} onOpenChange={(o) => !o && setDeletingBajada(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar este Despacho?</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-muted-foreground">Estás a punto de eliminar este registro de recepción de Finca:</p>
            {deletingBajada && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <p><strong>Fecha:</strong> {format(new Date(deletingBajada.fecha), "dd/MM/yyyy HH:mm")}</p>
                <p><strong>Total Cartones:</strong> {deletingBajada.cartonesPequeno + deletingBajada.cartonesMediano + deletingBajada.cartonesGrande + deletingBajada.cartonesJumbo}</p>
              </div>
            )}
            <p className="text-sm font-medium text-destructive mt-2">⚠️ El cálculo de Mermas se verá afectado. Esta acción no se puede deshacer.</p>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancelar</DialogClose>
            <Button variant="destructive" onClick={handleDeleteBajada} disabled={loading}>Sí, eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
