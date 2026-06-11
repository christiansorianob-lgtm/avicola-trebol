import { prisma } from "@/lib/prisma";
import ClientesClient from "./ClientesClient";

export default async function ClientesPage() {
  let data: { id: string; nombre: string; telefono: string | null; saldoPesos: number; saldoCartones: number; diasSinPagar: number }[] = [];

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

      c.movimientos.forEach(m => {
        if (m.tipo === "ENTREGA") {
          saldoPesos += (m.cartones || 0) * (m.precioUnit || 0);
          if (!hasEntrega || m.fecha.getTime() > lastEntregaTime) {
            lastEntregaTime = m.fecha.getTime();
            hasEntrega = true;
          }
        } else if (m.tipo === "PAGO") {
          saldoPesos -= (m.monto || 0);
        }
      });

      let diasSinPagar = 0;
      if (saldoPesos > 0 && hasEntrega) {
        diasSinPagar = Math.floor((now - lastEntregaTime) / (1000 * 60 * 60 * 24));
      }

      let cartonesPendientes = 0;
      if (saldoPesos > 0) {
        const entregas = c.movimientos.filter(m => m.tipo === "ENTREGA");
        if (entregas.length > 0) {
          const precioUltimo = entregas[0].precioUnit || 15000;
          cartonesPendientes = Math.ceil(saldoPesos / precioUltimo);
        }
      }

      return { id: c.id, nombre: c.nombre, telefono: c.telefono, saldoPesos, saldoCartones: cartonesPendientes, diasSinPagar };
    });
  } catch (error) {
    console.error("Database error on /clientes:", error);
  }

  return <ClientesClient initialData={data} />;
}
