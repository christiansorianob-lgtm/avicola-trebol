import { prisma } from "@/lib/prisma";
import ClientesClient from "./ClientesClient";
import { Suspense } from "react";

export default async function ClientesPage() {
  let data: { id: string; nombre: string; telefono: string | null; saldoPesos: number; saldoCartones: number; diasSinPagar: number; diasSinMovimiento: number; ultimaFecha: string | null; ultimaEntrega: { fecha: string; cantidad: number; clasificacion: string | null } | null }[] = [];

  try {
    const dbClientes = await prisma.cliente.findMany({
      include: { movimientos: { orderBy: { fecha: 'desc' } } },
      orderBy: { nombre: 'asc' }
    });

    const now = new Date().getTime();

    data = dbClientes.map(c => {
      let saldoPesos = 0;
      let hasEntrega = false;
      let lastEntregaTime = now;
      let lastMovimientoTime = 0;
      let ultimaEntrega: { fecha: string; cantidad: number; clasificacion: string | null } | null = null;

      c.movimientos.forEach(m => {
        if (m.fecha.getTime() > lastMovimientoTime) {
            lastMovimientoTime = m.fecha.getTime();
        }
        if (m.tipo === "ENTREGA") {
          saldoPesos += (m.cartones || 0) * (m.precioUnit || 0);
          if (!hasEntrega || m.fecha.getTime() > lastEntregaTime) {
            lastEntregaTime = m.fecha.getTime();
            hasEntrega = true;
            ultimaEntrega = {
                fecha: m.fecha.toISOString().slice(0, 10).split("-").reverse().join("/"),
                cantidad: m.cartones || 0,
                clasificacion: m.tipoCarton
            };
          }
        } else if (m.tipo === "PAGO") {
          saldoPesos -= (m.monto || 0);
        }
      });

      let diasSinPagar = 0;
      if (saldoPesos > 0 && hasEntrega) {
        diasSinPagar = Math.floor((now - lastEntregaTime) / (1000 * 60 * 60 * 24));
      }
      
      let diasSinMovimiento = lastMovimientoTime > 0 ? Math.floor((now - lastMovimientoTime) / (1000 * 60 * 60 * 24)) : -1;

      let cartonesPendientes = 0;
      if (saldoPesos > 0) {
        const entregas = c.movimientos.filter(m => m.tipo === "ENTREGA");
        if (entregas.length > 0) {
          const precioUltimo = entregas[0].precioUnit || 15000;
          cartonesPendientes = Math.ceil(saldoPesos / precioUltimo);
        }
      }

      const ultimaFecha = c.movimientos.length > 0
        ? c.movimientos[0].fecha.toISOString().slice(0, 10).split("-").reverse().join("/")
        : null;

      return { id: c.id, nombre: c.nombre, telefono: c.telefono, saldoPesos, saldoCartones: cartonesPendientes, diasSinPagar, diasSinMovimiento, ultimaFecha, ultimaEntrega };
    });
  } catch (error) {
    console.error("Database error on /clientes:", error);
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Cargando clientes...</div>}>
      <ClientesClient initialData={data} />
    </Suspense>
  );
}
