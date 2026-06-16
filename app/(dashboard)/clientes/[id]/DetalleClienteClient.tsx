"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeft, PlusCircle, Banknote, Calendar, Trash2, Edit, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registrarMovimiento, eliminarCliente, editarCliente, editarMovimiento, eliminarMovimiento, obtenerInventarioDisponible } from "@/app/actions";
import { PRECIOS_CARTON, ETIQUETAS_CARTON, TipoCartonType } from "@/lib/config";
import { TipoCarton } from "@prisma/client";
import jsPDF from "jspdf";

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
  tipoCarton: string | null;
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
  const [openDelete, setOpenDelete] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingMovimiento, setEditingMovimiento] = useState<Movimiento | null>(null);
  const [deletingMovimiento, setDeletingMovimiento] = useState<Movimiento | null>(null);

  // Edit Movimiento Form
  const [editMovFecha, setEditMovFecha] = useState("");
  const [editMovTipo, setEditMovTipo] = useState<"ENTREGA" | "PAGO">("ENTREGA");
  const [editMovCartones, setEditMovCartones] = useState("");
  const [editMovTipoCarton, setEditMovTipoCarton] = useState<TipoCartonType>("PEQUENO");
  const [editMovPrecioUnit, setEditMovPrecioUnit] = useState("");
  const [editMovMonto, setEditMovMonto] = useState("");
  const [editMovNotas, setEditMovNotas] = useState("");

  const openEditMov = (m: Movimiento) => {
    setEditingMovimiento(m);
    setEditMovFecha(format(new Date(m.fecha), "yyyy-MM-dd'T'HH:mm"));
    setEditMovTipo(m.tipo as "ENTREGA" | "PAGO");
    setEditMovCartones(m.cartones ? m.cartones.toString() : "");
    setEditMovTipoCarton((m.tipoCarton as TipoCartonType) || "PEQUENO");
    setEditMovPrecioUnit(m.precioUnit ? m.precioUnit.toString() : "");
    setEditMovMonto(m.monto ? m.monto.toString() : "");
    setEditMovNotas(m.notas || "");
  };

  const handleEditMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovimiento) return;
    setLoading(true);
    await editarMovimiento(editingMovimiento.id, {
      tipo: editMovTipo,
      fecha: new Date(editMovFecha),
      cartones: editMovTipo === "ENTREGA" ? parseInt(editMovCartones) : undefined,
      tipoCarton: editMovTipo === "ENTREGA" ? editMovTipoCarton : undefined,
      precioUnit: editMovTipo === "ENTREGA" ? parseFloat(editMovPrecioUnit) : undefined,
      monto: editMovTipo === "PAGO" ? parseFloat(editMovMonto) : undefined,
      notas: editMovNotas
    }, cliente.id);
    setLoading(false);
    setEditingMovimiento(null);
  };

  const handleDeleteMovimiento = async () => {
    if (!deletingMovimiento) return;
    setLoading(true);
    const res = await eliminarMovimiento(deletingMovimiento.id, cliente.id);
    setLoading(false);
    if (res.success) {
      setDeletingMovimiento(null);
    } else {
      alert("Error al eliminar movimiento");
    }
  };
  const [openRecibo, setOpenRecibo] = useState(false);
  const [openConfirmacionEntrega, setOpenConfirmacionEntrega] = useState(false);
  const [lastPagoData, setLastPagoData] = useState<{ monto: number; fecha: string; saldoRestante: number } | null>(null);
  const [lastEntregaData, setLastEntregaData] = useState<{ cantidad: number, clasificacion: string, precioUnit: number, total: number, fecha: string, saldoTotal: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [inventarioDisponible, setInventarioDisponible] = useState<Record<TipoCartonType, number> | null>(null);

  useEffect(() => {
    if (openEntrega) {
      obtenerInventarioDisponible().then(res => {
        if (res.success && res.inventario) {
          setInventarioDisponible(res.inventario as Record<TipoCartonType, number>);
        }
      });
    }
  }, [openEntrega]);

  // Form Entrega
  const [fechaEntrega, setFechaEntrega] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [cartones, setCartones] = useState("");
  const [tipoCarton, setTipoCarton] = useState<TipoCartonType>("PEQUENO");

  const getLastPrice = (type: TipoCartonType) => {
    const lastMov = movimientos.find(m => m.tipo === "ENTREGA" && m.tipoCarton === type && m.precioUnit != null);
    return lastMov && lastMov.precioUnit ? lastMov.precioUnit.toString() : PRECIOS_CARTON[type].toString();
  };

  const [precioUnit, setPrecioUnit] = useState(getLastPrice("PEQUENO"));
  const [notasEntrega, setNotasEntrega] = useState("");

  // Form Pago
  const [fechaPago, setFechaPago] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [monto, setMonto] = useState("");
  const [notasPago, setNotasPago] = useState("");

  // Form Edit
  const [editNombre, setEditNombre] = useState(cliente.nombre);
  const [editTelefono, setEditTelefono] = useState(cliente.telefono || "");
  const [editDireccion, setEditDireccion] = useState(cliente.direccion || "");

  const handleEntrega = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const numCartones = parseInt(cartones);
    const valPrecioUnit = parseFloat(precioUnit);
    
    await registrarMovimiento({
      clienteId: cliente.id,
      tipo: "ENTREGA",
      fecha: new Date(fechaEntrega),
      cartones: numCartones,
      tipoCarton: tipoCarton as TipoCarton,
      precioUnit: valPrecioUnit,
      notas: notasEntrega
    });
    
    setLoading(false);
    setOpenEntrega(false);
    
    setLastEntregaData({
      cantidad: numCartones,
      clasificacion: ETIQUETAS_CARTON[tipoCarton as TipoCartonType] || tipoCarton,
      precioUnit: valPrecioUnit,
      total: numCartones * valPrecioUnit,
      fecha: format(new Date(fechaEntrega), "dd/MM/yyyy"),
      saldoTotal: saldoPesos + (numCartones * valPrecioUnit)
    });
    setOpenConfirmacionEntrega(true);

    setCartones("");
    setPrecioUnit(valPrecioUnit.toString());
    setNotasEntrega("");
    setFechaEntrega(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  };

  const handlePago = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const montoPagado = parseFloat(monto);
    const fechaPagoDate = new Date(fechaPago);

    await registrarMovimiento({
      clienteId: cliente.id,
      tipo: "PAGO",
      fecha: fechaPagoDate,
      monto: montoPagado,
      notas: notasPago
    });
    
    setLoading(false);
    setOpenPago(false);

    // Show receipt dialog
    setLastPagoData({
      monto: montoPagado,
      fecha: format(fechaPagoDate, "dd/MM/yyyy HH:mm"),
      saldoRestante: Math.max(0, saldoPesos - montoPagado),
    });
    setOpenRecibo(true);

    setMonto("");
    setNotasPago("");
    setFechaPago(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  };

  const generateReciboPDF = () => {
    if (!lastPagoData) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(34, 139, 34);
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("RECIBO DE PAGO", pageWidth / 2, 18, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("Avícola El Trébol", pageWidth / 2, 30, { align: "center" });

    // Body
    doc.setTextColor(0, 0, 0);
    let y = 60;
    const leftMargin = 30;
    const valueX = 100;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Cliente:", leftMargin, y);
    doc.setFont("helvetica", "normal");
    doc.text(cliente.nombre, valueX, y);
    y += 14;

    doc.setFont("helvetica", "bold");
    doc.text("Fecha:", leftMargin, y);
    doc.setFont("helvetica", "normal");
    doc.text(lastPagoData.fecha, valueX, y);
    y += 14;

    doc.setFont("helvetica", "bold");
    doc.text("Monto Pagado:", leftMargin, y);
    doc.setFont("helvetica", "normal");
    doc.text(`$${lastPagoData.monto.toLocaleString("es-CO")}`, valueX, y);
    y += 14;

    doc.setFont("helvetica", "bold");
    doc.text("Saldo Restante:", leftMargin, y);
    doc.setFont("helvetica", "normal");
    doc.text(`$${lastPagoData.saldoRestante.toLocaleString("es-CO")}`, valueX, y);
    y += 24;

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(leftMargin, y, pageWidth - leftMargin, y);
    y += 14;

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("Gracias por su pago. Este documento sirve como comprobante.", pageWidth / 2, y, { align: "center" });

    doc.save(`recibo_${cliente.nombre.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  const handleWhatsAppReminder = () => {
    if (!cliente.telefono) {
      alert("Este cliente no tiene número de teléfono registrado. Agrega uno para enviar recordatorios.");
      return;
    }
    const cleanPhone = cliente.telefono.replace(/\D/g, "");
    const ultimaEntrega = movimientos.find(m => m.tipo === "ENTREGA");
    const saldo = Math.max(0, saldoPesos).toLocaleString("es-CO");
    let mensaje = `Hola ${cliente.nombre}, te recordamos que tienes un saldo pendiente de $${saldo} en Avícola El Trébol.`;
    
    if (ultimaEntrega) {
      const fechaFmt = format(new Date(ultimaEntrega.fecha), "dd/MM/yyyy", { locale: es });
      const cantidad = ultimaEntrega.cartones;
      const clasificacion = ultimaEntrega.tipoCarton ? ETIQUETAS_CARTON[ultimaEntrega.tipoCarton as TipoCartonType] : "";
      mensaje += ` Tu última entrega fue el ${fechaFmt} (${cantidad} cartones ${clasificacion.toLowerCase()}).`;
    }
    
    mensaje += ` Gracias por tu confianza!`;
    const url = `https://wa.me/57${cleanPhone}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await editarCliente(cliente.id, {
      nombre: editNombre,
      telefono: editTelefono,
      direccion: editDireccion
    });
    setLoading(false);
    if (res.success) {
      setOpenEdit(false);
    } else {
      alert("Error al editar cliente");
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    const res = await eliminarCliente(cliente.id);
    if (res.success) {
      router.push("/clientes");
    } else {
      alert("Error al eliminar cliente");
      setLoading(false);
    }
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
      <div className="flex items-center justify-between gap-4">
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
        
        <div className="flex items-center gap-2">
          <Dialog open={openEdit} onOpenChange={setOpenEdit}>
            <DialogTrigger render={<Button variant="outline" size="icon" className="text-muted-foreground" />}>
              <Edit className="w-4 h-4" />
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleEdit}>
                <DialogHeader>
                  <DialogTitle>Editar Cliente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nombre o Razón Social</Label>
                    <Input required value={editNombre} onChange={e => setEditNombre(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input value={editTelefono} onChange={e => setEditTelefono(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input value={editDireccion} onChange={e => setEditDireccion(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" type="button" />}>Cancelar</DialogClose>
                  <Button type="submit" disabled={loading}>Guardar Cambios</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={openDelete} onOpenChange={setOpenDelete}>
            <DialogTrigger render={<Button variant="destructive" size="sm" className="hidden sm:flex" />}>
              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
            </DialogTrigger>
            {/* For mobile just the icon */}
            <DialogTrigger render={<Button variant="destructive" size="icon" className="sm:hidden" />}>
              <Trash2 className="w-4 h-4" />
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>¿Eliminar Cliente?</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-muted-foreground">
                  Estás a punto de eliminar al cliente <strong className="text-foreground">{cliente.nombre}</strong>.
                </p>
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm font-medium">
                  ⚠️ Advertencia: Esto también eliminará permanentemente <strong>todos sus movimientos asociados</strong> (entregas y pagos). Esta acción no se puede deshacer.
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancelar
                </DialogClose>
                <Button variant="destructive" disabled={loading} onClick={handleDelete}>
                  Sí, eliminar todo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                <div className="space-y-2">
                  <Label>Fecha de Entrega</Label>
                  <Input type="datetime-local" required value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cantidad de cartones</Label>
                    <Input type="number" required value={cartones} onChange={e => setCartones(e.target.value)} min="1" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Cartón</Label>
                    <Select value={tipoCarton} onValueChange={(val) => {
                      if (!val) return;
                      const selected = val as TipoCartonType;
                      setTipoCarton(selected);
                      setPrecioUnit(getLastPrice(selected));
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PEQUENO">Pequeño — ${PRECIOS_CARTON.PEQUENO.toLocaleString("es-CO")}</SelectItem>
                        <SelectItem value="MEDIANO">Mediano — ${PRECIOS_CARTON.MEDIANO.toLocaleString("es-CO")}</SelectItem>
                        <SelectItem value="GRANDE">Grande — ${PRECIOS_CARTON.GRANDE.toLocaleString("es-CO")}</SelectItem>
                        <SelectItem value="JUMBO">Jumbo — ${PRECIOS_CARTON.JUMBO.toLocaleString("es-CO")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Precio por cartón ($)</Label>
                  <Input type="number" required value={precioUnit} onChange={e => setPrecioUnit(e.target.value)} min="1" />
                </div>
                {inventarioDisponible !== null && parseInt(cartones || "0") > inventarioDisponible[tipoCarton] && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-md text-yellow-600 dark:text-yellow-500 text-sm font-medium">
                    Atención: no hay suficiente inventario disponible. Actualmente tienes {inventarioDisponible[tipoCarton]} cartones {ETIQUETAS_CARTON[tipoCarton].toLowerCase()} en stock. Esta entrega dejará el inventario en {inventarioDisponible[tipoCarton] - parseInt(cartones || "0")} cartones.
                  </div>
                )}
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
                  <Label>Fecha del Pago</Label>
                  <Input type="datetime-local" required value={fechaPago} onChange={e => setFechaPago(e.target.value)} />
                </div>
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

        {/* WhatsApp Reminder */}
        <Button
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          size="lg"
          onClick={handleWhatsAppReminder}
        >
          <MessageCircle className="mr-2 h-5 w-5" /> Recordar por WhatsApp
        </Button>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={openRecibo} onOpenChange={setOpenRecibo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pago Registrado Exitosamente</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2 text-sm">
            <p>Se registró un pago de <strong>${lastPagoData?.monto.toLocaleString("es-CO")}</strong> para <strong>{cliente.nombre}</strong>.</p>
            <p className="text-muted-foreground">¿Deseas descargar un recibo o enviar confirmación por WhatsApp?</p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-end">
            <DialogClose render={<Button variant="outline" className="w-full sm:w-auto" />}>Cerrar</DialogClose>
            <Button variant="secondary" className="w-full sm:w-auto" onClick={() => { generateReciboPDF(); setOpenRecibo(false); }}>
              Descargar PDF
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              disabled={!cliente.telefono}
              onClick={() => {
                if (!cliente.telefono) return;
                const cleanPhone = cliente.telefono.replace(/\D/g, "");
                const p = lastPagoData;
                if (!p) return;
                
                let mensaje = `Hola ${cliente.nombre}, confirmamos la recepción de tu pago de $${p.monto.toLocaleString("es-CO")} en Avícola El Trébol el ${p.fecha}. `;
                
                if (p.saldoRestante === 0) {
                  mensaje += `¡Tu cuenta está al día! Gracias por tu pago.`;
                } else {
                  mensaje += `Tu saldo pendiente actualizado es de $${p.saldoRestante.toLocaleString("es-CO")}. ¡Gracias!`;
                }
                
                window.open(`https://wa.me/57${cleanPhone}?text=${encodeURIComponent(mensaje)}`, "_blank");
                setOpenRecibo(false);
              }}
            >
              <MessageCircle className="mr-2 h-4 w-4" /> 
              {cliente.telefono ? "Enviar por WhatsApp" : "Sin teléfono"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Delivery Dialog */}
      <Dialog open={openConfirmacionEntrega} onOpenChange={setOpenConfirmacionEntrega}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrega Registrada Exitosamente</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2 text-sm">
            <p>Se registró la entrega de <strong>{lastEntregaData?.cantidad} cartones</strong> a <strong>{cliente.nombre}</strong>.</p>
            <p className="text-muted-foreground">¿Deseas enviar una confirmación del pedido por WhatsApp?</p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-end">
            <DialogClose render={<Button variant="outline" className="w-full sm:w-auto" />}>No, gracias</DialogClose>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              disabled={!cliente.telefono}
              onClick={() => {
                if (!cliente.telefono) return;
                const cleanPhone = cliente.telefono.replace(/\D/g, "");
                const d = lastEntregaData;
                if (!d) return;
                const mensaje = `Hola ${cliente.nombre}, te confirmamos tu pedido de Avícola El Trébol: ${d.cantidad} cartones ${d.clasificacion.toLowerCase()} ($${d.precioUnit.toLocaleString("es-CO")} c/u) = $${d.total.toLocaleString("es-CO")}. Fecha de entrega: ${d.fecha}. Saldo total pendiente: $${d.saldoTotal.toLocaleString("es-CO")}. Gracias por tu compra!`;
                window.open(`https://wa.me/57${cleanPhone}?text=${encodeURIComponent(mensaje)}`, "_blank");
                setOpenConfirmacionEntrega(false);
              }}
            >
              <MessageCircle className="mr-2 h-4 w-4" /> 
              {cliente.telefono ? "Enviar por WhatsApp" : "Sin teléfono"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {movsAsc.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
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
                        <span>{m.cartones} cartones {m.tipoCarton ? ETIQUETAS_CARTON[m.tipoCarton as TipoCartonType] : ''}</span>
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
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditMov(m)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingMovimiento(m)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Formulario Editar Movimiento */}
      <Dialog open={!!editingMovimiento} onOpenChange={(open) => !open && setEditingMovimiento(null)}>
        <DialogContent>
          <form onSubmit={handleEditMovimiento}>
            <DialogHeader>
              <DialogTitle>Editar {editMovTipo === "ENTREGA" ? "Entrega" : "Pago"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="datetime-local" required value={editMovFecha} onChange={e => setEditMovFecha(e.target.value)} />
              </div>
              
              {editMovTipo === "ENTREGA" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cantidad de cartones</Label>
                      <Input type="number" required value={editMovCartones} onChange={e => setEditMovCartones(e.target.value)} min="1" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Cartón</Label>
                      <Select value={editMovTipoCarton} onValueChange={(val) => setEditMovTipoCarton(val as TipoCartonType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PEQUENO">Pequeño</SelectItem>
                          <SelectItem value="MEDIANO">Mediano</SelectItem>
                          <SelectItem value="GRANDE">Grande</SelectItem>
                          <SelectItem value="JUMBO">Jumbo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Precio por cartón ($)</Label>
                    <Input type="number" required value={editMovPrecioUnit} onChange={e => setEditMovPrecioUnit(e.target.value)} min="1" />
                  </div>
                </>
              )}

              {editMovTipo === "PAGO" && (
                <div className="space-y-2">
                  <Label>Monto Pagado ($)</Label>
                  <Input type="number" required value={editMovMonto} onChange={e => setEditMovMonto(e.target.value)} min="1" />
                </div>
              )}

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Input value={editMovNotas} onChange={e => setEditMovNotas(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button" />}>
                Cancelar
              </DialogClose>
              <Button type="submit" disabled={loading}>Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmar Eliminar Movimiento */}
      <Dialog open={!!deletingMovimiento} onOpenChange={(o) => !o && setDeletingMovimiento(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar este registro?</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-muted-foreground">Estás a punto de eliminar permanentemente este registro:</p>
            {deletingMovimiento && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <p><strong>Tipo:</strong> {deletingMovimiento.tipo}</p>
                <p><strong>Fecha:</strong> {format(new Date(deletingMovimiento.fecha), "dd/MM/yyyy HH:mm")}</p>
                <p><strong>Monto/Valor:</strong> {deletingMovimiento.tipo === "ENTREGA" 
                  ? `$${((deletingMovimiento.cartones || 0) * (deletingMovimiento.precioUnit || 0)).toLocaleString("es-CO")}`
                  : `$${(deletingMovimiento.monto || 0).toLocaleString("es-CO")}`}</p>
              </div>
            )}
            <p className="text-sm font-medium text-destructive mt-2">⚠️ El saldo del cliente se recalculará automáticamente. Esta acción no se puede deshacer.</p>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancelar</DialogClose>
            <Button variant="destructive" onClick={handleDeleteMovimiento} disabled={loading}>Sí, eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
