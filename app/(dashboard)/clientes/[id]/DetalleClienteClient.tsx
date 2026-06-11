"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, PlusCircle, Banknote, Calendar } from "lucide-react";
import Link from "next/link";
import { registrarMovimiento } from "@/app/actions";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
};

type Movimiento = {
  id: string;
  tipo: string;
  fecha: Date;
  cartones: number | null;
  tipoCarton: number | null;
  precioUnit: number | null;
  monto: number | null;
  notas: string | null;
};

export default function DetalleClienteClient({ 
  cliente, 
  movimientos,
  saldoPesos,
  saldoCartones
}: { 
  cliente: Cliente, 
  movimientos: Movimiento[],
  saldoPesos: number,
  saldoCartones: number
}) {
  const [openEntrega, setOpenEntrega] = useState(false);
  const [openPago, setOpenPago] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Entrega
  const [cartones, setCartones] = useState("");
  const [tipoCarton, setTipoCarton] = useState("30"); // default 30 (aunque el prompt dice 13,15,18,20)
  const [precioUnit, setPrecioUnit] = useState("");
  const [notasEntrega, setNotasEntrega] = useState("");

  // Form Pago
  const [monto, setMonto] = useState("");
  const [notasPago, setNotasPago] = useState("");

  const handleEntrega = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const numCartones = parseInt(cartones);
    const valPrecioUnit = parseFloat(precioUnit);
    
    await registrarMovimiento({
      clienteId: cliente.id,
      tipo: "ENTREGA",
      fecha: new Date(), // TODO: add date picker for custom date
      cartones: numCartones,
      tipoCarton: parseInt(tipoCarton),
      precioUnit: valPrecioUnit,
      notas: notasEntrega
    });
    
    setLoading(false);
    setOpenEntrega(false);
    setCartones("");
    setPrecioUnit("");
    setNotasEntrega("");
  };

  const handlePago = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    await registrarMovimiento({
      clienteId: cliente.id,
      tipo: "PAGO",
      fecha: new Date(),
      monto: parseFloat(monto),
      notas: notasPago
    });
    
    setLoading(false);
    setOpenPago(false);
    setMonto("");
    setNotasPago("");
  };

  let saldoAcumulado = 0;
  // Para calcular el saldo acumulado fila por fila, invertimos la lista (viene desc, la hacemos asc)
  const movsAsc = [...movimientos].reverse().map(m => {
    if (m.tipo === "ENTREGA") {
      saldoAcumulado += (m.cartones || 0) * (m.precioUnit || 0);
    } else {
      saldoAcumulado -= (m.monto || 0);
    }
    return { ...m, saldoAcumulado };
  }).reverse(); // volvemos a desc para mostrar

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clientes">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{cliente.nombre}</h2>
          {cliente.telefono && <p className="text-muted-foreground">Tel: {cliente.telefono} {cliente.direccion && `| Dir: ${cliente.direccion}`}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">Saldo Pendiente (Pesos)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              ${Math.max(0, saldoPesos).toLocaleString("es-CO")}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aprox. Cartones Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {saldoCartones}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Formulario Entrega */}
        <Dialog open={openEntrega} onOpenChange={setOpenEntrega}>
          <DialogTrigger render={<Button className="flex-1" size="lg" />}>
            <PlusCircle className="mr-2 h-5 w-5" /> Registrar Entrega
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleEntrega}>
              <DialogHeader>
                <DialogTitle>Registrar Entrega de Huevos</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cantidad de cartones</Label>
                    <Input type="number" required value={cartones} onChange={e => setCartones(e.target.value)} min="1" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo (huevos/cartón)</Label>
                    <Select value={tipoCarton} onValueChange={(val) => setTipoCarton(val || "30")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="13">13 huevos</SelectItem>
                        <SelectItem value="15">15 huevos</SelectItem>
                        <SelectItem value="18">18 huevos</SelectItem>
                        <SelectItem value="20">20 huevos</SelectItem>
                        <SelectItem value="30">30 huevos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Precio por cartón ($)</Label>
                  <Input type="number" required value={precioUnit} onChange={e => setPrecioUnit(e.target.value)} min="1" />
                </div>
                <div className="space-y-2">
                  <Label>Notas (opcional)</Label>
                  <Input value={notasEntrega} onChange={e => setNotasEntrega(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" type="button" />}>
                  Cancelar
                </DialogClose>
                <Button type="submit" disabled={loading}>Guardar Entrega</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Formulario Pago */}
        <Dialog open={openPago} onOpenChange={setOpenPago}>
          <DialogTrigger render={<Button className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80" size="lg" />}>
            <Banknote className="mr-2 h-5 w-5" /> Registrar Pago
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handlePago}>
              <DialogHeader>
                <DialogTitle>Registrar Pago Recibido</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Monto Pagado ($)</Label>
                  <Input type="number" required value={monto} onChange={e => setMonto(e.target.value)} min="1" />
                </div>
                <div className="space-y-2">
                  <Label>Notas (opcional)</Label>
                  <Input value={notasPago} onChange={e => setNotasPago(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" type="button" />}>
                  Cancelar
                </DialogClose>
                <Button type="submit" disabled={loading} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
                  Guardar Pago
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Movimientos</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Detalle</th>
                  <th className="px-4 py-3 text-right">Monto / Valor</th>
                  <th className="px-4 py-3 text-right">Saldo Acum.</th>
                </tr>
              </thead>
              <tbody>
                {movsAsc.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No hay movimientos registrados
                    </td>
                  </tr>
                )}
                {movsAsc.map(m => (
                  <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {format(new Date(m.fecha), "dd/MM/yyyy")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.tipo === "ENTREGA" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.tipo === "ENTREGA" ? (
                        <span>{m.cartones} cartones de {m.tipoCarton}</span>
                      ) : (
                        <span>Abono/Pago</span>
                      )}
                      {m.notas && <p className="text-xs text-muted-foreground mt-0.5">{m.notas}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {m.tipo === "ENTREGA" ? (
                        <span className="text-primary">+${((m.cartones || 0) * (m.precioUnit || 0)).toLocaleString("es-CO")}</span>
                      ) : (
                        <span className="text-destructive">-${m.monto?.toLocaleString("es-CO")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      ${Math.max(0, m.saldoAcumulado).toLocaleString("es-CO")}
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
